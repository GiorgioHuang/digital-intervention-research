import { useState } from 'react';
import { staffActionError } from '../errors.js';
import { staffApi, type StaffSession } from '../staff-api.js';

/**
 * Bringing a supporter into a participant's study.
 *
 * `POST /v1/relationships` existed with no caller anywhere in the product,
 * so the whole supporter path — a family member seeing what the
 * participant chose to share, contributing to their life story, the
 * participant approving or refusing them — could only be started by
 * whoever could call the API directly. In the demo it existed because the
 * seed made it. A coordinator could not bring anybody in.
 *
 * Two things on this screen have to be right.
 *
 * Proposing grants nothing. The participant approves it themselves, and
 * until they do the person named here can do nothing at all. A coordinator
 * who believed otherwise would tell a family member they now have access.
 *
 * And the list of what the relationship may permit contains only actions
 * a relationship is consulted for. Every other dotted action in the
 * platform is decided by role or by ownership and would not consult this
 * list, so offering a longer menu here would record permissions that
 * nothing reads — a supporter told they may do something they cannot, or a
 * participant believing they limited something they did not.
 *
 * One entry on the list is in exactly that position today, and saying so
 * is the only honest thing to do with it. `participant.view-shared` is
 * checked by no code anywhere: no query is gated on it, no screen shows a
 * supporter anything a participant has shared, and there is no control by
 * which a participant could share an item in the first place. Ticking it
 * grants nothing. It was the box ticked by default, which meant the usual
 * way to bring a supporter in was to record a permission that does not
 * work and let the participant approve it believing they had shared their
 * information. It is still offered — the intent is worth recording and
 * relationships already carry it — but nothing on this screen, or on the
 * participant's, may describe it as access (D-39).
 *
 * Messaging is on the list as its own line rather than folded into seeing
 * (D-29): a participant who wanted a niece to read their life story and
 * nothing more would otherwise have granted her a channel into their inbox
 * by accident.
 */
const PERMITTED_ACTIONS: { action: string; label: string; detail: string; inert?: boolean }[] = [
  {
    action: 'participant.view-shared',
    label: 'See what the participant chooses to share',
    detail:
      'NOT IN USE. Nothing in this platform reads this permission: no screen shows a supporter anything, and a participant has no way to mark something as shared. Ticking it records an intention and grants no access at all. Do not tell anyone it does.',
    inert: true,
  },
  {
    action: 'relationship.message',
    label: 'Write to the participant, and read what they write back',
    detail:
      'Granted separately from the others on purpose: being trusted to see what someone shares is not the same as being allowed into their inbox. The participant opens the conversation — a supporter cannot start one — and taking this permission back stops it at that moment.',
  },
  {
    action: 'life-story.contribute',
    label: 'Offer additions to their life story',
    detail:
      'Offers only — the participant decides what is accepted, and an accepted contribution is still not their own testimony. Also needs supporter-contribution consent.',
  },
];

/** The platform's own vocabulary, in words rather than in code names. */
const RELATIONSHIP_TYPES = [
  { value: 'FamilyMember', label: 'Family member' },
  { value: 'Friend', label: 'Friend' },
  { value: 'InformalCaregiver', label: 'Informal carer' },
  { value: 'ProfessionalCaregiver', label: 'Professional carer' },
  { value: 'CommunityVolunteer', label: 'Community volunteer' },
  { value: 'ResearchStaff', label: 'Research staff' },
  { value: 'SubstituteDecisionMaker', label: 'Substitute decision-maker' },
  { value: 'SupportedDecisionMakingAssistant', label: 'Supported decision-making assistant' },
  { value: 'OrganisationMember', label: 'Member of an organisation' },
  { value: 'OtherApproved', label: 'Something else that has been approved' },
];

export function ProposeRelationship({ session }: { session: StaffSession }) {
  const [form, setForm] = useState({
    participantId: '',
    relatedActorId: '',
    relationshipType: 'FamilyMember',
  });
  // Nothing is ticked to begin with. The default was the one permission
  // that does nothing, so the shortest path through this screen recorded
  // an access right the participant would then approve believing it real.
  const [actions, setActions] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const toggle = (action: string) =>
    setActions((current) =>
      current.includes(action) ? current.filter((a) => a !== action) : [...current, action],
    );

  const propose = async () => {
    try {
      const res = await staffApi.proposeRelationship(
        session,
        form.participantId.trim(),
        form.relatedActorId.trim(),
        form.relationshipType,
        actions,
      );
      setAnnouncement(
        `Proposed: ${res.data.id}. Nothing is in force yet — it waits for the participant to approve it.`,
      );
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That proposal'));
    }
  };

  return (
    <section aria-labelledby="propose-rel-heading">
      <h3 id="propose-rel-heading">Propose a supporter for a participant</h3>
      {/* Said first, because everything else on the screen reads differently
          if this is not understood. */}
      <p>
        <strong>Proposing does not grant anything.</strong> The participant approves or refuses it themselves, and
        until they approve it the person named here can do nothing. Do not tell them they have access.
      </p>
      <p>
        <label htmlFor="rel-participant">Participant identifier</label>{' '}
        <input
          id="rel-participant"
          value={form.participantId}
          onChange={(e) => setForm({ ...form, participantId: e.target.value })}
        />
      </p>
      <p>
        <label htmlFor="rel-actor">The supporter&apos;s account identifier</label>{' '}
        <input
          id="rel-actor"
          value={form.relatedActorId}
          onChange={(e) => setForm({ ...form, relatedActorId: e.target.value })}
        />
      </p>
      <p>
        <label htmlFor="rel-type">How they are related</label>{' '}
        <select
          id="rel-type"
          value={form.relationshipType}
          onChange={(e) => setForm({ ...form, relationshipType: e.target.value })}
        >
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </p>

      <h4>What this relationship would allow</h4>
      {PERMITTED_ACTIONS.map((p) => (
        <p key={p.action}>
          <input
            id={`rel-act-${p.action}`}
            type="checkbox"
            checked={actions.includes(p.action)}
            onChange={() => toggle(p.action)}
          />{' '}
          <label htmlFor={`rel-act-${p.action}`}>{p.label}</label>
          <br />
          <small>{p.detail}</small>
        </p>
      ))}
      {/*
        Naming the limit rather than leaving a short list to look arbitrary.
        A coordinator who cannot find some other permission here needs to
        know it is missing because no relationship gates it, not because
        this screen is withholding it.
      */}
      <p>
        <small>
          These are the only ones. Every other thing a person can do on this platform is decided by their role or by
          it being their own information, and would not look at this list at all — so a longer menu here would record
          permissions that nothing reads.
        </small>
      </p>
      {/*
        Said at the moment of choosing, not in a footnote: a coordinator
        who ticks only the inert permission is about to hand the
        participant a decision that reads as sharing and is not.
      */}
      {actions.length > 0 && actions.every((a) => PERMITTED_ACTIONS.find((p) => p.action === a)?.inert === true) && (
        <p role="note">
          <strong>Everything you have chosen is a permission nothing acts on.</strong> If you propose this, the
          participant will be asked to approve a relationship that lets this person do nothing at all — and it will
          read to them as though they had shared their information.
        </p>
      )}
      <p>
        <button
          disabled={form.participantId.trim() === '' || form.relatedActorId.trim() === '' || actions.length === 0}
          onClick={() => void propose()}
        >
          Propose this relationship
        </button>
      </p>
      {actions.length === 0 && (
        <p role="note">
          A relationship that permits nothing would be a record with no effect. Choose at least one, or do not propose
          it.
        </p>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
