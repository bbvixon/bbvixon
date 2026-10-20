import type { DesignStorySection } from "./portfolioData";

type StorySectionsProps = {
  sections: DesignStorySection[];
};

export function StorySections({ sections }: StorySectionsProps) {
  return (
    <section className="cmsStorySections" aria-label="Case study sections">
      {sections.map((section, index) => (
        <article className={section.imageUrl ? "cmsStorySection withImage" : "cmsStorySection"} key={`${section.title}-${index}`}>
          <div className="cmsStorySectionCopy">
            {section.eyebrow ? <p className="streamLabel">{section.eyebrow}</p> : null}
            <h2>{section.title}</h2>
            {section.body.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {section.imageUrl ? (
            <img src={section.imageUrl} alt={section.imageAlt || section.title} loading={index === 0 ? "eager" : "lazy"} />
          ) : null}
        </article>
      ))}
    </section>
  );
}
