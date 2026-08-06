import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type ResearchProjectItem, type StaffSession } from '../staff-api.js';

/**
 * The projects in this organisation, and the questions they ask.
 *
 * `project.view` was granted to the researcher and checked by no code,
 * and nothing anywhere listed a project. A researcher created one, saw
 * its identifier once in an announcement, and had no way to see it again
 * — while every screen downstream (protocol versions, enrolment,
 * datasets, exports) asked them to type that identifier back in from
 * memory. The head of the research chain was the only part of it with no
 * list.
 *
 * `research_questions` had a table from the day M04 was written, with a
 * text column and a state, and nothing ever inserted a row;
 * `question.create` was granted and checked nowhere. So a research
 * project was a title and nothing else, and the one sentence saying what
 * the study is for had nowhere to live.
 *
 * Two things this screen is careful about.
 *
 * It shows no lifecycle. `project_state` and `project_phase` exist with
 * eight and nine values, and nothing writes either, so every project
 * carries 'Draft' and 'Design' as column defaults. Printing those would
 * put a study's position on the screen as though somebody had set it.
 *
 * And a question is documentation. Nothing in the platform reads one, and
 * that is not a defect — it is what a research question is. Saying so
 * keeps it distinct from a control that records a decision nothing acts
 * on, which is a different thing and would not be built.
 */
export function ResearchProjects({ session }: { session: StaffSession }) {
  const [projects, setProjects] = useState<ResearchProjectItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const scoped = session.organisationId !== undefined && session.organisationId !== '';

  const load = async () => {
    try {
      const res = await staffApi.listResearchProjects(session);
      setProjects(res.data.map((p) => ({ ...p.attributes, questions: p.attributes.questions ?? [] })));
      setError('');
    } catch (err) {
      setError(staffLoadError(err, 'the research projects'));
    }
  };

  useEffect(() => {
    if (scoped) void load();
  }, []);

  const addQuestion = async (projectId: string) => {
    const text = (drafts[projectId] ?? '').trim();
    if (text === '') return;
    try {
      await staffApi.addResearchQuestion(session, projectId, text);
      setDrafts({ ...drafts, [projectId]: '' });
      setAnnouncement('The question was recorded on this project.');
      await load();
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That question'));
    }
  };

  return (
    <section aria-labelledby="projects-heading">
      <h3 id="projects-heading">Research projects</h3>
      <p>
        The projects in your organisation, with their identifiers — the screens further along ask for these, and
        until now the only place an identifier appeared was the message shown when the project was created.
      </p>
      {/*
        Said rather than quietly omitted, and for the same reason the
        intervention screen refuses to print an evidence grade: a
        lifecycle position nobody set would read as one somebody did.
      */}
      <p>
        <small>
          Where a project has got to is not shown, because it is not recorded. The platform has columns for a
          project&apos;s state and phase and nothing anywhere writes them, so every project would read the same
          whatever was happening to it.
        </small>
      </p>

      {!scoped ? (
        <p role="alert">
          You are signed in without an organisation, so there is no set of projects to show. This is not a permission
          problem — there is nothing here to scope the list to.
        </p>
      ) : (
        <p>
          <button onClick={() => void load()}>Refresh</button>
        </p>
      )}
      {error !== '' && <p role="alert">{error}</p>}
      {projects !== null && projects.length === 0 && <p>No research projects in this organisation yet.</p>}

      {(projects ?? []).map((p) => (
        <article key={p.researchProjectId} aria-label={`Project ${p.title}`}>
          <h4>{p.title}</h4>
          <p>
            <code>{p.researchProjectId}</code>
            <br />
            <small>
              Started by {p.createdByActorId} on {new Date(p.createdAt).toLocaleDateString()}
            </small>
          </p>

          <h5>What this study is asking</h5>
          {p.questions.length === 0 ? (
            <p>
              No question written down. Nothing stops the study without one — but nobody reading this project later
              will know what it set out to answer.
            </p>
          ) : (
            <ol>
              {p.questions.map((q) => (
                <li key={q.researchQuestionId}>
                  {q.questionText}
                  <br />
                  <small>Written on {new Date(q.createdAt).toLocaleDateString()}</small>
                </li>
              ))}
            </ol>
          )}
          <p>
            <label htmlFor={`rq-${p.researchProjectId}`}>Add a question</label>
            <br />
            <input
              id={`rq-${p.researchProjectId}`}
              size={60}
              value={drafts[p.researchProjectId] ?? ''}
              onChange={(e) => setDrafts({ ...drafts, [p.researchProjectId]: e.target.value })}
            />{' '}
            <button
              disabled={(drafts[p.researchProjectId] ?? '').trim() === ''}
              onClick={() => void addQuestion(p.researchProjectId)}
            >
              Record this question
            </button>
          </p>
          {/*
            The distinction that has to be drawn here, because everything
            else this project has built refuses to offer a control nothing
            reads. This one is not that: its reader is a person.
          */}
          <p>
            <small>
              Nothing in the platform acts on a question — it is not a filter, a gate or a setting. It is written
              down so that whoever reads this project later knows what it was for.
            </small>
          </p>
        </article>
      ))}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
