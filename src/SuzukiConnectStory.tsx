import type { DesignStorySection } from "./portfolioData";

type SuzukiConnectStoryProps = {
  sections?: DesignStorySection[];
};

const moments = [
  ["Before the drive", "New-customer delight", "Help owners discover useful connected features in their first week."],
  ["When it matters", "Trust by design", "Show freshness, acknowledgement, uncertainty, and the safest next step."],
  ["After the drive", "Long-term retention", "Turn verified vehicle signals into understandable care and support."],
];

const capabilities = ["Live tracking", "Geofences", "Remote operations", "Vehicle health", "Trip history", "Watch & Alexa access"];

const journey = ["Discover", "Onboard", "Prepare", "Act", "Recover", "Retain"];

const metrics = [
  ["01", "First-week activation", "Do owners discover and use a meaningful connected feature?"],
  ["02", "Task success + time", "Can they understand status and complete an important action?"],
  ["03", "Freshness recognition", "Can they tell live data from stale or unknown data?"],
  ["04", "Acknowledged vs attempted", "Do they understand whether the vehicle confirmed a command?"],
  ["05", "30-day engagement", "Does useful confidence create a reason to return and renew?"],
  ["06", "Repeat support contacts", "Does recovery guidance reduce repeated help requests?"],
];

function PhoneFrame({ label, children, tone = "default" }: { label: string; children: React.ReactNode; tone?: "default" | "success" | "warning" }) {
  return (
    <article className={`suzukiPhone ${tone}`}>
      <div className="suzukiPhoneTop"><span>9:41</span><i aria-hidden="true" /></div>
      <div className="suzukiPhoneBody">
        <p className="suzukiPhoneLabel">{label}</p>
        {children}
      </div>
      <div className="suzukiPhoneHome" aria-hidden="true" />
    </article>
  );
}

export function SuzukiConnectStory({ sections = [] }: SuzukiConnectStoryProps) {
  const section = (index: number) => sections[index];

  return (
    <section className="suzukiStory" aria-label="Suzuki Connect ONE UX case study">
      <section className="suzukiHeroVisual">
        <div className="suzukiHeroCopy">
          <p className="streamLabel">UX Case Study · Connected Ownership</p>
          <h2>A car that feels<br />one step ahead.</h2>
          <p>{section(0)?.body?.split("\n\n")[1] ?? "A connected-car concept designed around useful discovery, honest system states, and confident ownership."}</p>
          <div className="suzukiHeroNote"><span>Concept focus</span><strong>Delight first. Confidence always.</strong></div>
        </div>
        <div className="suzukiDeviceStage">
          <div className="suzukiStageGlow" aria-hidden="true" />
          <img src="/design/suzuki-connect-device-montage.png" alt="Suzuki Connect interface shown across several mobile devices" />
        </div>
      </section>

      <section className="suzukiMoments" aria-label="Three ownership moments">
        {moments.map(([eyebrow, title, copy], index) => (
          <article key={title}><span>0{index + 1}</span><p>{eyebrow}</p><h3>{title}</h3><small>{copy}</small></article>
        ))}
      </section>

      <section className="suzukiEditorial">
        <div>
          <p className="streamLabel">The Opportunity</p>
          <h2>{section(0)?.title ?? "Connected should mean confident"}</h2>
        </div>
        <div className="suzukiEditorialBody">
          <p>{section(0)?.body?.split("\n\n")[0]}</p>
          <div className="suzukiCapabilityGrid">
            {capabilities.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>)}
          </div>
          <small>Capability availability depends on the vehicle model and variant.</small>
        </div>
      </section>

      <section className="suzukiEvidence">
        <div className="suzukiSectionHeading">
          <p className="streamLabel">Customer Evidence</p>
          <h2>{section(1)?.title ?? "Trust breaks when the system cannot explain itself."}</h2>
          <p>Selected public reviews and community discussions informed four hypotheses to validate—not a claim that every owner has the same experience.</p>
        </div>
        <div className="suzukiSignalGrid">
          <article><span>01</span><h3>Stale information</h3><p>Location, fuel, or status can lose meaning when recency is unclear.</p></article>
          <article><span>02</span><h3>Action uncertainty</h3><p>A sent command is not the same as a vehicle-confirmed outcome.</p></article>
          <article><span>03</span><h3>Broken continuity</h3><p>Renewal and support can pull owners away from the moment they are in.</p></article>
          <article><span>04</span><h3>Fragmented journey</h3><p>Connected ownership should feel like one service, not separate products.</p></article>
        </div>
      </section>

      <section className="suzukiStrategy">
        <div className="suzukiSectionHeading compact">
          <p className="streamLabel">Product Strategy</p>
          <h2>Two engines.<br />One ownership experience.</h2>
        </div>
        <div className="suzukiEngineGrid">
          <article><span>DISCOVERY ENGINE</span><h3>My Suzuki Day</h3><p>A calm pre-drive briefing that reveals connected value early: the next trip, planned departure, available range context, and useful reminders.</p><b>Reason to try</b></article>
          <article><span>CONFIDENCE ENGINE</span><h3>Trust by design</h3><p>Timestamps, command acknowledgement, explicit unknown states, and practical recovery when vehicle connectivity fails.</p><b>Reason to return</b></article>
        </div>
      </section>

      <section className="suzukiArchitecture">
        <div className="suzukiSectionHeading">
          <p className="streamLabel">Experience Architecture</p>
          <h2>Ready. Live. Care.</h2>
        </div>
        <div className="suzukiArchitectureGrid">
          <article><span>READY</span><h3>Prepare the next drive</h3><p>Destinations, departure context, range when available, and reminders.</p></article>
          <article><span>LIVE</span><h3>Make confidence visible</h3><p>Freshness, acknowledgement, pending states, and honest uncertainty.</p></article>
          <article><span>CARE</span><h3>Turn signals into action</h3><p>Understandable maintenance information and guided support pathways.</p></article>
        </div>
        <div className="suzukiJourney" aria-label="Ownership journey">
          {journey.map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}
        </div>
      </section>

      <section className="suzukiPrototype">
        <div className="suzukiSectionHeading">
          <p className="streamLabel">Illustrative Prototype</p>
          <h2>The interface tells the truth about what the car knows.</h2>
          <p>Interface states below translate the deck into a connected flow. Trip and vehicle values are illustrative until connected to validated vehicle signals.</p>
        </div>
        <div className="suzukiPhoneGrid three">
          <PhoneFrame label="HOME">
            <p className="phoneHello">Good morning, Basil</p><h3>Ready for your day</h3><div className="phoneHeroCard"><small>NEXT DRIVE</small><strong>Office</strong><span>Leave by 8:20 AM · 12 km</span></div><div className="phoneStatus"><b>Vehicle locked</b><span>Verified 2 min ago</span></div><button type="button">View My Suzuki Day</button>
          </PhoneFrame>
          <PhoneFrame label="MY SUZUKI DAY">
            <h3>Your next drive</h3><div className="phoneRoute"><i>HOME</i><span /><i>OFFICE</i></div><div className="phoneStatRow"><span><small>DEPARTURE</small><b>8:20 AM</b></span><span><small>RANGE</small><b>286 km</b></span></div><div className="phoneReminder"><b>Before you leave</b><p>Tyre pressure was checked on your last drive.</p></div><button type="button">Start navigation</button>
          </PhoneFrame>
          <PhoneFrame label="VEHICLE STATUS">
            <div className="phoneCarIcon">S</div><h3>Everything looks ready</h3><div className="phoneStatusList"><span><b>Doors</b><em>Last confirmed locked</em></span><span><b>Location</b><em>Updated 2 min ago</em></span><span><b>Fuel</b><em>286 km estimated range</em></span></div><small className="phoneFootnote">Vehicle data received 2 min ago</small>
          </PhoneFrame>
        </div>
      </section>

      <section className="suzukiCommandFlow">
        <div className="suzukiSectionHeading compact">
          <p className="streamLabel">Remote Action</p>
          <h2>A request is not a confirmation.</h2>
        </div>
        <div className="suzukiPhoneGrid three command">
          <PhoneFrame label="SENDING COMMAND"><div className="phonePulse"><span /></div><h3>Lock request sent</h3><p>Waiting for your vehicle to respond.</p><div className="phoneInfo">Not yet confirmed</div></PhoneFrame>
          <PhoneFrame label="VEHICLE CONFIRMED" tone="success"><div className="phoneResultIcon">✓</div><h3>Vehicle locked</h3><p>Confirmed by your vehicle at 9:42 AM.</p><div className="phoneInfo">Previous request acknowledged</div><button type="button">Done</button></PhoneFrame>
          <PhoneFrame label="CONNECTION UNAVAILABLE" tone="warning"><div className="phoneResultIcon">!</div><h3>Current status unknown</h3><p>We could not confirm the lock request.</p><div className="phoneInfo">Last confirmed locked · 35 hours ago</div><div className="phoneRecovery"><b>What you can do</b><span>Check network · Wait and retry · Get support</span></div></PhoneFrame>
        </div>
      </section>

      <section className="suzukiCareGrid">
        <article className="suzukiCareCopy"><p className="streamLabel">Care & Consent</p><h2>{section(7)?.title ?? "Support stays clear. Sharing stays controlled."}</h2><p>Verified signals lead to understandable next steps without inventing a diagnosis. Family Circle stays off until the owner chooses what to share, with whom, and for how long.</p></article>
        <PhoneFrame label="VEHICLE CARE"><div className="phoneResultIcon">✓</div><h3>No urgent action</h3><p>Your verified vehicle signals do not show an immediate concern.</p><div className="phoneReminder"><b>Service reminder</b><p>Review scheduled maintenance in 24 days.</p></div><button type="button">Review maintenance</button></PhoneFrame>
        <PhoneFrame label="FAMILY CIRCLE"><h3>Share on your terms</h3><p>Sharing is disabled until you choose.</p><div className="phoneToggle"><span><b>Arrival updates</b><small>Selected people</small></span><i /></div><div className="phoneToggle"><span><b>Vehicle status</b><small>Not shared</small></span><i /></div><div className="phoneReminder"><b>Permission</b><p>Editable at any time · Set an expiry date</p></div><button type="button">Manage permissions</button></PhoneFrame>
      </section>

      <section className="suzukiValidation">
        <div className="suzukiSectionHeading compact"><p className="streamLabel">Validation Plan</p><h2>Measure discovery, comprehension, and recovery.</h2><p>{section(8)?.body?.split("\n\n")[0]}</p></div>
        <div className="suzukiMetricGrid">{metrics.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        <div className="suzukiValidationGraphic"><img src="/design/suzuki-connect-validation.png" alt="Validation questions for the Suzuki Connect ONE concept" /></div>
      </section>

      <footer className="suzukiDisclaimer">
        <strong>Independent UX exploration</strong>
        <p>This concept is not affiliated with or endorsed by Maruti Suzuki. Prototype values are illustrative. Feature availability varies by model and variant.</p>
      </footer>
    </section>
  );
}
