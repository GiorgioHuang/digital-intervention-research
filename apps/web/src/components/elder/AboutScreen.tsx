import { BrandBlock } from './BrandMark.js';
import { COPYRIGHT_HOLDER } from './SiteFooter.js';
import { ContactBox } from './ContactBox.js';

/**
 * "About this project" — the prototype's about screen, reached from the
 * footer on every screen and from Help.
 *
 * "Get in touch" is a box to write in. It was a telephone number in the
 * 555-01xx range, which is reserved for fiction so that no real line is
 * dialled by accident — so the number a person in difficulty would ring
 * reached nobody. The owner replaced it with a message relay of the same
 * shape as their own (2026-08-31), which closes B-22.
 *
 * What was lost with the number is worth naming rather than glossing: the
 * card said a person answers between eight in the morning and eight at
 * night, every day. Nothing answers a written message at a stated time,
 * and nothing on this screen now claims to.
 */

export function AboutScreen({
  onBack,
  backLabel,
  contactConfigured,
}: {
  onBack: () => void;
  backLabel: string;
  contactConfigured: boolean;
}) {
  return (
    <section aria-labelledby="about-heading">
      <p>
        <button className="back-link" onClick={onBack}>
          ‹ {backLabel}
        </button>
      </p>
      <div className="about__brand">
        <BrandBlock />
      </div>
      <h1 id="about-heading">About this project</h1>
      <p>
        icareu is a place for older people in Canada to write down their own life story, in their own words, and to
        read the stories of others who choose to share them.
      </p>
      <p>
        It is run by the Healthy Aging Intelligence Lab. Taking part is voluntary, and stopping does not affect any
        care or service you receive.
      </p>

      <h2>How your story is treated</h2>
      {/*
        Three promises, and each one is kept by something in this codebase
        rather than being a claim on a page: private by default is the
        consent projection the permission engine reads; nothing is added
        without acceptance is the owner-only contribution review; and there
        is no advertising path in the platform at all.
      */}
      <ul className="about__promises">
        <li>Everything you write is private until you decide otherwise</li>
        <li>Nothing is added to your story unless you accept it</li>
        <li>We never sell your information, and never contact you to sell anything</li>
      </ul>

      <h2>Get in touch</h2>
      <p>
        Write to the people who run the study. Your message goes to them and to nobody else, and it is not part of your
        life story.
      </p>
      <ContactBox configured={contactConfigured} />

      <p className="about__address">{COPYRIGHT_HOLDER}</p>
    </section>
  );
}
