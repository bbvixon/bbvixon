import { useMemo, useState } from "react";
import type { DesignStory, DesignStorySection, PortfolioApp } from "./portfolioData";
import { CmsAppsEditor } from "./CmsAppsEditor";

type CmsAdminProps = {
  defaultStories: DesignStory[];
  defaultApps: PortfolioApp[];
};

const blankStory = (): DesignStory => ({
  slug: "new-story",
  title: "New story",
  role: "UX Case Study",
  summary: "Add a short portfolio summary.",
  outcome: "Describe the outcome or value.",
  tags: [],
  sections: [],
  pageImages: [],
  status: "ready",
  published: false,
  sortOrder: 100,
});

const normalizeStory = (story: DesignStory): DesignStory => ({
  ...story,
  slug: story.slug || story.title.toLowerCase().replace(/\s+/g, "-"),
  tags: story.tags ?? [],
  pageImages: story.pageImages ?? [],
  sections: story.sections ?? [],
  published: story.published !== false,
  sortOrder: story.sortOrder ?? 0,
});

export function CmsAdmin({ defaultStories, defaultApps }: CmsAdminProps) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("bbvixon-cms-key") ?? "");
  const [stories, setStories] = useState<DesignStory[]>(defaultStories.map(normalizeStory));
  const [selectedSlug, setSelectedSlug] = useState(defaultStories[0]?.slug ?? "");
  const [message, setMessage] = useState("Enter the CMS admin key configured on Render.");
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeStory = useMemo(
    () => stories.find((story) => story.slug === selectedSlug) ?? stories[0] ?? blankStory(),
    [selectedSlug, stories],
  );

  const replaceActiveStory = (updates: Partial<DesignStory>) => {
    setStories((current) => current.map((story) => (story.slug === activeStory.slug ? { ...story, ...updates } : story)));
  };

  const connect = async () => {
    setMessage("Connecting...");
    try {
      const response = await fetch("/api/admin/design-stories", {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not open the CMS.");

      const savedStories: DesignStory[] = Array.isArray(data.stories) ? data.stories.map(normalizeStory) : [];
      const savedBySlug = new Map(savedStories.map((story) => [story.slug, story]));
      const merged = [
        ...defaultStories.map((story) => savedBySlug.get(story.slug) ?? normalizeStory(story)),
        ...savedStories.filter((story) => !defaultStories.some((fallback) => fallback.slug === story.slug)),
      ];
      sessionStorage.setItem("bbvixon-cms-key", adminKey);
      setStories(merged);
      setSelectedSlug(merged[0]?.slug ?? "");
      setIsConnected(true);
      setMessage(savedStories.length ? "CMS connected. Saved stories loaded." : "CMS connected. Save each fallback story to start managing it from PostgreSQL.");
    } catch (error) {
      setIsConnected(false);
      setMessage(error instanceof Error ? error.message : "Could not connect to the CMS.");
    }
  };

  const save = async () => {
    setIsSaving(true);
    setMessage("Saving...");
    try {
      const response = await fetch(`/api/admin/design-stories/${encodeURIComponent(activeStory.slug)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activeStory),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save the story.");
      const saved = normalizeStory(data.story);
      setStories((current) => current.map((story) => (story.slug === activeStory.slug ? saved : story)));
      setSelectedSlug(saved.slug);
      setMessage(`${saved.title} is saved${saved.published ? " and published" : " as a draft"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the story.");
    } finally {
      setIsSaving(false);
    }
  };

  const addStory = () => {
    const next = blankStory();
    let suffix = 1;
    while (stories.some((story) => story.slug === next.slug)) {
      suffix += 1;
      next.slug = `new-story-${suffix}`;
      next.title = `New story ${suffix}`;
    }
    setStories((current) => [...current, next]);
    setSelectedSlug(next.slug);
  };

  const updateSection = (index: number, updates: Partial<DesignStorySection>) => {
    const sections = [...(activeStory.sections ?? [])];
    sections[index] = { ...sections[index], ...updates };
    replaceActiveStory({ sections });
  };

  const addSection = () => {
    replaceActiveStory({
      sections: [...(activeStory.sections ?? []), { eyebrow: "Section", title: "Section title", body: "Write the section content here." }],
    });
  };

  const removeSection = (index: number) => {
    replaceActiveStory({ sections: (activeStory.sections ?? []).filter((_, sectionIndex) => sectionIndex !== index) });
  };

  return (
    <main className="cmsPage">
      <header className="cmsHeader">
        <div>
          <p className="kicker">Private editor</p>
          <h1>Portfolio CMS</h1>
          <p>Update design stories and apps in PostgreSQL and publish them immediately—no rebuild required.</p>
        </div>
        <a href="/#design">View portfolio</a>
      </header>

      {!isConnected ? (
        <section className="cmsLogin">
          <label>
            CMS admin key
            <input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} autoComplete="current-password" />
          </label>
          <button type="button" onClick={connect} disabled={!adminKey}>Open CMS</button>
          <p>{message}</p>
        </section>
      ) : (
        <>
        <div className="cmsWorkspace">
          <aside className="cmsStoryList">
            <button type="button" className="cmsNewStory" onClick={addStory}>+ New story</button>
            {stories.map((story) => (
              <button type="button" className={story.slug === activeStory.slug ? "active" : ""} key={story.slug} onClick={() => setSelectedSlug(story.slug)}>
                <span>{story.title}</span>
                <small>{story.published ? "Published" : "Draft"}</small>
              </button>
            ))}
          </aside>

          <section className="cmsEditor">
            <div className="cmsEditorToolbar">
              <div><strong>{activeStory.title}</strong><span>{message}</span></div>
              <button type="button" onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</button>
            </div>

            <div className="cmsFieldGrid">
              <label>Slug<input value={activeStory.slug} disabled={stories.some((story) => story.slug === activeStory.slug && defaultStories.some((fallback) => fallback.slug === story.slug))} onChange={(event) => { const slug = event.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, "-"); replaceActiveStory({ slug }); setSelectedSlug(slug); }} /></label>
              <label>Sort order<input type="number" value={activeStory.sortOrder ?? 0} onChange={(event) => replaceActiveStory({ sortOrder: Number(event.target.value) })} /></label>
              <label className="wide">Title<input value={activeStory.title} onChange={(event) => replaceActiveStory({ title: event.target.value })} /></label>
              <label>Role<input value={activeStory.role} onChange={(event) => replaceActiveStory({ role: event.target.value })} /></label>
              <label>Tags<input value={activeStory.tags.join(", ")} onChange={(event) => replaceActiveStory({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></label>
              <label className="wide">Summary<textarea value={activeStory.summary} onChange={(event) => replaceActiveStory({ summary: event.target.value })} /></label>
              <label className="wide">Outcome<textarea value={activeStory.outcome} onChange={(event) => replaceActiveStory({ outcome: event.target.value })} /></label>
              <label>Thumbnail URL<input value={activeStory.thumbnailUrl ?? ""} onChange={(event) => replaceActiveStory({ thumbnailUrl: event.target.value })} /></label>
              <label>Figma URL<input value={activeStory.figmaUrl ?? ""} onChange={(event) => replaceActiveStory({ figmaUrl: event.target.value })} /></label>
              <label className="wide">Page image URLs<textarea value={(activeStory.pageImages ?? []).join("\n")} onChange={(event) => replaceActiveStory({ pageImages: event.target.value.split("\n").map((url) => url.trim()).filter(Boolean) })} /></label>
              <label className="cmsCheck"><input type="checkbox" checked={activeStory.published !== false} onChange={(event) => replaceActiveStory({ published: event.target.checked })} /> Published</label>
            </div>

            <div className="cmsSectionsHeader"><div><p className="kicker">Page content</p><h2>Story sections</h2></div><button type="button" onClick={addSection}>+ Add section</button></div>
            <div className="cmsSections">
              {(activeStory.sections ?? []).map((section, index) => (
                <article key={`${section.title}-${index}`}>
                  <div className="cmsSectionTop"><strong>Section {index + 1}</strong><button type="button" onClick={() => removeSection(index)}>Remove</button></div>
                  <label>Eyebrow<input value={section.eyebrow ?? ""} onChange={(event) => updateSection(index, { eyebrow: event.target.value })} /></label>
                  <label>Title<input value={section.title} onChange={(event) => updateSection(index, { title: event.target.value })} /></label>
                  <label>Body<textarea value={section.body} onChange={(event) => updateSection(index, { body: event.target.value })} /></label>
                  <label>Image URL<input value={section.imageUrl ?? ""} onChange={(event) => updateSection(index, { imageUrl: event.target.value })} /></label>
                  <label>Image description<input value={section.imageAlt ?? ""} onChange={(event) => updateSection(index, { imageAlt: event.target.value })} /></label>
                </article>
              ))}
              {(activeStory.sections ?? []).length === 0 ? <p className="cmsEmpty">No editable sections yet. Add one to replace the legacy case-study body with CMS content.</p> : null}
            </div>
          </section>
        </div>
        <CmsAppsEditor adminKey={adminKey} defaultApps={defaultApps} />
        </>
      )}
    </main>
  );
}
