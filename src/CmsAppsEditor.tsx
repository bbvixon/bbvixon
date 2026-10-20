import { useEffect, useMemo, useState } from "react";
import type { PortfolioApp } from "./portfolioData";

type CmsAppsEditorProps = {
  adminKey: string;
  defaultApps: PortfolioApp[];
};

const blankApp = (): PortfolioApp => ({
  slug: "new-app",
  title: "New app",
  tagline: "A short promise for this app.",
  description: "Describe what the app does and why someone should try it.",
  url: "https://",
  iconUrl: "",
  category: "Web app",
  platform: "Browser",
  published: false,
  sortOrder: 100,
});

const normalizeApp = (app: PortfolioApp): PortfolioApp => ({
  ...app,
  published: app.published !== false,
  sortOrder: app.sortOrder ?? 0,
});

export function CmsAppsEditor({ adminKey, defaultApps }: CmsAppsEditorProps) {
  const [apps, setApps] = useState<PortfolioApp[]>(defaultApps.map(normalizeApp));
  const [selectedSlug, setSelectedSlug] = useState(defaultApps[0]?.slug ?? "");
  const [message, setMessage] = useState("Loading apps...");
  const [isSaving, setIsSaving] = useState(false);

  const activeApp = useMemo(
    () => apps.find((app) => app.slug === selectedSlug) ?? apps[0] ?? blankApp(),
    [apps, selectedSlug],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/apps", {
      headers: { Authorization: `Bearer ${adminKey}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load apps.");
        return data;
      })
      .then((data) => {
        const savedApps: PortfolioApp[] = Array.isArray(data.apps) ? data.apps.map(normalizeApp) : [];
        const savedBySlug = new Map(savedApps.map((app) => [app.slug, app]));
        const merged = [
          ...defaultApps.map((app) => savedBySlug.get(app.slug) ?? normalizeApp(app)),
          ...savedApps.filter((app) => !defaultApps.some((fallback) => fallback.slug === app.slug)),
        ];
        setApps(merged);
        setSelectedSlug(merged[0]?.slug ?? "");
        setMessage(savedApps.length ? "Saved apps loaded." : "Save each starter app to begin managing it from PostgreSQL.");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage(error instanceof Error ? error.message : "Could not load apps.");
      });

    return () => controller.abort();
  }, [adminKey, defaultApps]);

  const replaceActiveApp = (updates: Partial<PortfolioApp>) => {
    setApps((current) => current.map((app) => (app.slug === activeApp.slug ? { ...app, ...updates } : app)));
  };

  const addApp = () => {
    const next = blankApp();
    let suffix = 1;
    while (apps.some((app) => app.slug === next.slug)) {
      suffix += 1;
      next.slug = `new-app-${suffix}`;
      next.title = `New app ${suffix}`;
    }
    setApps((current) => [...current, next]);
    setSelectedSlug(next.slug);
  };

  const save = async () => {
    setIsSaving(true);
    setMessage("Saving...");
    try {
      const response = await fetch(`/api/admin/apps/${encodeURIComponent(activeApp.slug)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activeApp),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save the app.");
      const saved = normalizeApp(data.app);
      setApps((current) => current.map((app) => (app.slug === activeApp.slug ? saved : app)));
      setSelectedSlug(saved.slug);
      setMessage(`${saved.title} is saved${saved.published ? " and published" : " as a draft"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the app.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="cmsAppsSection" id="cms-apps">
      <div className="cmsCollectionHeading">
        <div>
          <p className="kicker">App store</p>
          <h2>Apps</h2>
          <p>Add future projects here without changing or redeploying the portfolio.</p>
        </div>
        <a href="/#apps" target="_blank" rel="noreferrer">View Apps page</a>
      </div>

      <div className="cmsWorkspace cmsAppsWorkspace">
        <aside className="cmsStoryList">
          <button type="button" className="cmsNewStory" onClick={addApp}>+ New app</button>
          {apps.map((app) => (
            <button type="button" className={app.slug === activeApp.slug ? "active" : ""} key={app.slug} onClick={() => setSelectedSlug(app.slug)}>
              <span>{app.title}</span>
              <small>{app.published ? "Published" : "Draft"}</small>
            </button>
          ))}
        </aside>

        <section className="cmsEditor">
          <div className="cmsEditorToolbar">
            <div><strong>{activeApp.title}</strong><span>{message}</span></div>
            <button type="button" onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save app"}</button>
          </div>

          <div className="cmsFieldGrid">
            <label>Slug<input value={activeApp.slug} disabled={defaultApps.some((app) => app.slug === activeApp.slug)} onChange={(event) => { const slug = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); replaceActiveApp({ slug }); setSelectedSlug(slug); }} /></label>
            <label>Sort order<input type="number" value={activeApp.sortOrder ?? 0} onChange={(event) => replaceActiveApp({ sortOrder: Number(event.target.value) })} /></label>
            <label className="wide">Title<input value={activeApp.title} onChange={(event) => replaceActiveApp({ title: event.target.value })} /></label>
            <label className="wide">Tagline<input value={activeApp.tagline} onChange={(event) => replaceActiveApp({ tagline: event.target.value })} /></label>
            <label className="wide">Description<textarea value={activeApp.description} onChange={(event) => replaceActiveApp({ description: event.target.value })} /></label>
            <label className="wide">App URL<input type="url" value={activeApp.url} onChange={(event) => replaceActiveApp({ url: event.target.value })} /></label>
            <label className="wide">Icon URL<input value={activeApp.iconUrl} onChange={(event) => replaceActiveApp({ iconUrl: event.target.value })} placeholder="/apps/example-icon.png or a public URL" /></label>
            <label>Category<input value={activeApp.category} onChange={(event) => replaceActiveApp({ category: event.target.value })} /></label>
            <label>Platform<input value={activeApp.platform} onChange={(event) => replaceActiveApp({ platform: event.target.value })} /></label>
            <label className="cmsCheck"><input type="checkbox" checked={activeApp.published !== false} onChange={(event) => replaceActiveApp({ published: event.target.checked })} /> Published</label>
          </div>
        </section>
      </div>
    </section>
  );
}
