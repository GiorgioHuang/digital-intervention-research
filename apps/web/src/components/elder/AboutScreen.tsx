import { BrandBlock } from './BrandMark.js';
import { COPYRIGHT_HOLDER } from './SiteFooter.js';

/**
 * "About this project" — the prototype's about screen, reached from the
 * footer on every screen and from Help.
 *
 * **The telephone number is a placeholder and must not reach a
 * participant.** 1 800 555 0142 is in the 555-01xx range, which is
 * reserved for fiction precisely so that nobody's real line is dialled by
 * accident — and the consequence here is specific: this is the number a
 * person in difficulty rings, on a screen built for somebody who may have
 * no other way to ask for help. It is one constant, named so that nothing
 * else can quietly copy it, and it is recorded as a gap (B-22).
 */
export const HELPLINE_PLACEHOLDER = '1 800 555 0142';

export function AboutScreen({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
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
      <div className="phone-card">
        <p className="kicker">Telephone, free of charge</p>
        {/*
          A real link, not text: on the device most of these people are
          holding, a number that cannot be pressed is a number that has to
          be copied out by hand.
        */}
        <p className="phone-card__number">
          <a href={`tel:${HELPLINE_PLACEHOLDER.replace(/\s/g, '')}`}>{HELPLINE_PLACEHOLDER}</a>
        </p>
        <p className="phone-card__hours">
          Eight in the morning until eight at night, every day. A person answers.
        </p>
      </div>

      <p className="about__address">
        {COPYRIGHT_HOLDER}
        <br />
        Dalhousie University, Halifax, Nova Scotia
      </p>
    </section>
  );
}
