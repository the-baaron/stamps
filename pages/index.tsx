import Head from "next/head";
import React, { useState } from "react";
import { track } from "helpers/track";
import styles from "../styles/Home.module.css";

import { allowedFonts } from "helpers/generateSVG/types";
import { API, parseStampPath } from "helpers/stamp";
import { Playground, Preset } from "components/Playground";
import { Snippet } from "components/Snippet";
import { Stamp } from "components/Stamp";

const DONATE_URL = "https://www.paypal.com/donate/?hosted_button_id=GEVLMP9A5FQM6";
const COFFEE_STAMP =
  "Buy%20me%20a%20coffee?icon=mug-hot&backgroundColor=FFDD00&color=121212&padding=10&borderRadius=8";

const fonts = Object.keys(allowedFonts).filter((v) => isNaN(Number(v)));

const heroStamps = [
  "Read%20the%20docs?icon=book&backgroundColor=121212&padding=10&borderRadius=6",
  "Download?icon=download&backgroundColor=E5484D&padding=10&borderRadius=6",
  "Star%20on%20GitHub?icon=github&backgroundColor=white&color=121212&borderWidth=1&borderColor=121212&padding=10&borderRadius=6",
  "Sponsor?icon=heart&iconStyle=regular&backgroundColor=FFE4E1&color=C2185B&padding=10&borderRadius=17",
  "Live%20demo?icon=arrow-right&iconPosition=after&backgroundColor=0794e0&padding=10&borderRadius=6",
];

const gallery = [
  "Example?borderWidth=2&borderColor=2B303A&backgroundColor=white&color=2B303A",
  "Example?backgroundColor=BAC1B8&color=2B303A&borderRadius=0&fontSize=20&fontFamily=courier%20new",
  "Example?backgroundColor=0C7C59&color=white&borderRadius=15&fontFamily=andale%20mono",
  "Example?borderRadius=16&fontFamily=comic%20sans%20ms&backgroundColor=FF7F51",
  "Button%20with%20a%20very%20long%20text%20in%20it?backgroundColor=eee&borderWidth=1&borderColor=ccc&color=000",
  "Install?icon=terminal&backgroundColor=1E1E1E&color=7CFC9A&fontFamily=courier%20new&padding=10&borderRadius=4",
  "Discord?icon=discord&backgroundColor=5865F2&padding=10&borderRadius=8",
  "Buy%20me%20a%20coffee?icon=mug-hot&backgroundColor=FFDD00&color=121212&padding=10&borderRadius=8",
  "Changelog?icon=clock-rotate-left&iconStyle=solid&backgroundColor=F4F0EA&color=121212&borderWidth=1&borderColor=121212&padding=8&borderRadius=0",
  "Next?icon=arrow-right&iconPosition=after&backgroundColor=6D28D9&padding=10&borderRadius=17",
];

interface ParamExample {
  // The part of the URL the card is about, shown next to the button.
  show: string;
  src: string;
}

// A real-looking button: label, the params being shown, then its styling.
const ex = (label: string, show: string, style: string): ParamExample => ({
  show,
  src: `${encodeURIComponent(label)}?${show}&${style}`,
});

const ink = "backgroundColor=121212&color=white&padding=10&borderRadius=6";
const red = "backgroundColor=E5484D&color=white&padding=10&borderRadius=6";
const paper =
  "backgroundColor=F4F0EA&color=121212&borderWidth=1&borderColor=121212&padding=10&borderRadius=6";

interface Param {
  names: string[];
  defaults: string[];
  body: React.ReactNode;
  examples: ParamExample[];
}

const params: Param[] = [
  {
    names: ["fontFamily"],
    defaults: ["helvetica"],
    body: (
      <>
        One of: {fonts.map((f, i) => (
          <React.Fragment key={f}>
            <code>{f}</code>
            {i < fonts.length - 1 && ", "}
          </React.Fragment>
        ))}
        . Write spaces as <code>%20</code>.
      </>
    ),
    examples: [
      ex("Read the essay", "fontFamily=georgia", `icon=book-open&${paper}`),
      ex("make install", "fontFamily=courier%20new", "icon=terminal&backgroundColor=1E1E1E&color=7CFC9A&padding=10&borderRadius=6"),
    ],
  },
  {
    names: ["fontSize"],
    defaults: ["14"],
    body: "Text size in pixels. The icon scales with it.",
    examples: [
      ex("Download", "fontSize=12", `icon=download&${red}`),
      ex("Download", "fontSize=16", `icon=download&${red}`),
      ex("Download", "fontSize=22", `icon=download&${red}`),
    ],
  },
  {
    names: ["borderRadius"],
    defaults: ["4"],
    body: "Corner rounding in pixels.",
    examples: [
      ex("Subscribe", "borderRadius=0", "icon=bell&backgroundColor=121212&padding=10"),
      ex("Subscribe", "borderRadius=8", "icon=bell&backgroundColor=121212&padding=10"),
      ex("Subscribe", "borderRadius=17", "icon=bell&backgroundColor=121212&padding=10"),
    ],
  },
  {
    names: ["backgroundColor"],
    defaults: ["0794e0"],
    body: (
      <>
        A colour name like <code>teal</code> or a hex value without the{" "}
        <code>#</code>, like <code>C0FFEE</code>.
      </>
    ),
    examples: [
      ex("Live demo", "backgroundColor=E5484D", "icon=play&padding=10&borderRadius=6"),
      ex("Live demo", "backgroundColor=teal", "icon=play&padding=10&borderRadius=6"),
    ],
  },
  {
    names: ["color"],
    defaults: ["white"],
    body: "Colour of the text and the icon. Names and hex values both work.",
    examples: [
      ex("Star on GitHub", "color=FFD166", "icon=star&backgroundColor=121212&padding=10&borderRadius=6"),
      ex("Report a bug", "color=E5484D", "icon=bug&backgroundColor=FFF1F1&padding=10&borderRadius=6"),
    ],
  },
  {
    names: ["borderWidth", "borderColor"],
    defaults: ["0", "0b76b0"],
    body: "Border thickness in pixels, and its colour.",
    examples: [
      ex("Changelog", "borderWidth=2&borderColor=121212", "icon=clock-rotate-left&backgroundColor=white&color=121212&padding=10&borderRadius=6"),
      ex("Breaking change", "borderWidth=2&borderColor=E5484D", "icon=triangle-exclamation&backgroundColor=FFF1F1&color=C9363B&padding=10&borderRadius=6"),
    ],
  },
  {
    names: ["padding"],
    defaults: ["0"],
    body: (
      <>
        Space around the text. When set, it replaces the four values below
        (left and right get 4px extra).
      </>
    ),
    examples: [
      ex("v2.4.0", "padding=3", "icon=code-branch&backgroundColor=F4F0EA&color=121212&borderRadius=4&fontFamily=courier%20new"),
      ex("Get started", "padding=14", `icon=rocket&backgroundColor=E5484D&borderRadius=8`),
    ],
  },
  {
    names: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
    defaults: ["8", "16", "8", "16"],
    body: "Space on one side only.",
    examples: [
      ex("Join the beta", "paddingLeft=32&paddingRight=32", "backgroundColor=121212&paddingTop=10&paddingBottom=10&borderRadius=17"),
      ex("Docs", "paddingLeft=6&paddingRight=10", "icon=book&backgroundColor=F4F0EA&color=121212&paddingTop=6&paddingBottom=6&borderRadius=4"),
    ],
  },
  {
    names: ["icon"],
    defaults: [""],
    body: (
      <>
        Any free{" "}
        <a href="https://fontawesome.com/search?ic=free" rel="noreferrer" target="_blank">
          Font Awesome
        </a>{" "}
        icon by name. Unknown names are ignored, so the button still renders.
      </>
    ),
    examples: [
      ex("Discord", "icon=discord", "backgroundColor=5865F2&padding=10&borderRadius=6"),
      ex("Download for macOS", "icon=apple", ink),
    ],
  },
  {
    names: ["iconStyle"],
    defaults: ["solid"],
    body: (
      <>
        <code>solid</code>, <code>regular</code> or <code>brands</code>. If the
        icon is not drawn in that style, another style is used.
      </>
    ),
    examples: [
      ex("Favourite", "iconStyle=solid", "icon=heart&backgroundColor=FFE4E1&color=C2185B&padding=10&borderRadius=17"),
      ex("Favourite", "iconStyle=regular", "icon=heart&backgroundColor=FFE4E1&color=C2185B&padding=10&borderRadius=17"),
    ],
  },
  {
    names: ["iconPosition"],
    defaults: ["before"],
    body: (
      <>
        <code>before</code> or <code>after</code> the text.
      </>
    ),
    examples: [
      ex("Back", "iconPosition=before", `icon=arrow-left&${paper}`),
      ex("Continue", "iconPosition=after", `icon=arrow-right&${red}`),
    ],
  },
];

export default function Home() {
  const [preset, setPreset] = useState<Preset>();

  const openInPlayground = (path: string) => {
    track("example_opened", { path });
    setPreset({ settings: parseStampPath(path), id: Date.now() });
    document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>Stamps: buttons for your README</title>
        <meta
          name="description"
          content="Free, customizable SVG buttons for GitHub READMEs, Markdown files and websites, generated from a single URL."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.nav}>
        <a href="#top" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true">S</span>
          Stamps
        </a>
        <nav>
          <a href="#playground">Playground</a>
          <a href="#parameters">Parameters</a>
          <a href="#examples">Examples</a>
          <a href="https://github.com/the-baaron/stamps" rel="noreferrer" target="_blank">
            GitHub
          </a>
          <a
            href={DONATE_URL}
            rel="noreferrer"
            target="_blank"
            className={styles.coffee}
            onClick={() => track("coffee_clicked")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${API}${COFFEE_STAMP}`} alt="Buy me a coffee" />
          </a>
        </nav>
      </header>

      <main id="top" className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.pill}>Free · No sign-up · Retina-ready SVG</span>
          <h1>
            Buttons for your README,{" "}
            <span className={styles.accent}>made from a link.</span>
          </h1>
          <p className={styles.lede}>
            Put your text in a URL, add a few parameters, and paste it into any
            Markdown file, GitHub README, blog or website. No account, no build
            step.
          </p>
          <div className={styles.heroActions}>
            <a href="#playground" className={styles.buttonPrimary}>
              Make a button
            </a>
            <a href="#parameters" className={styles.buttonSecondary}>
              See all parameters
            </a>
          </div>
          <div className={styles.heroStamps}>
            {heroStamps.map((src, i) => (
              <Stamp
                key={src}
                src={src}
                tilt={[-4, 3, -2, 4, -3][i]}
                title="Open in the playground"
                onClick={() => openInPlayground(src)}
              />
            ))}
          </div>
          <span className={styles.postmark} aria-hidden="true">
            <span>Delivered</span>
            <strong>SVG</strong>
            <span>via URL</span>
          </span>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>How it works</h2>
          </div>
          <ol className={styles.steps}>
            <li>
              <strong>Write your text in the link</strong>
              <code>{API.replace("https://", "")}Example</code>
            </li>
            <li>
              <strong>Add parameters after a ?</strong>
              <code>?backgroundColor=0C7C59&amp;icon=heart</code>
            </li>
            <li>
              <strong>Paste it anywhere images work</strong>
              <code>![Button](…)</code>
            </li>
          </ol>
          <div className={styles.basics}>
            <Snippet url={`${API}Example`} />
            <div className={styles.basicsPreview}>
              <Stamp src="Example" />
            </div>
          </div>
        </section>

        <section className={styles.section} id="playground">
          <div className={styles.sectionHead}>
            <h2>Playground</h2>
            <p>Change anything. The link and the snippets update as you go.</p>
          </div>
          <Playground preset={preset} />
        </section>

        <section className={styles.section} id="parameters">
          <div className={styles.sectionHead}>
            <h2>Parameters</h2>
            <p>
              Start with <code>?</code> and join more with <code>&amp;</code>.
              Every parameter is optional.
            </p>
          </div>
          <div className={styles.paramGrid}>
            {params.map((p) => (
              <article className={styles.paramCard} key={p.names[0]}>
                <div className={styles.paramNames}>
                  {p.names.map((name, i) => (
                    <code key={name}>
                      {name}
                      {p.defaults[i] !== "" && <span>={p.defaults[i]}</span>}
                    </code>
                  ))}
                </div>
                <p>{p.body}</p>
                <div className={styles.paramExamples}>
                  {p.examples.map(({ src, show }) => (
                    <button
                      type="button"
                      key={src}
                      className={styles.paramExample}
                      onClick={() => openInPlayground(src)}
                      title="Open in the playground"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${API}${src}`} alt={`Example with ${show}`} />
                      <code>
                        {show.split("&").map((part, i) => (
                          <React.Fragment key={part}>
                            {i > 0 && (
                              <>
                                &amp;
                                <wbr />
                              </>
                            )}
                            <span>{part}</span>
                          </React.Fragment>
                        ))}
                      </code>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="examples">
          <div className={styles.sectionHead}>
            <h2>Examples</h2>
            <p>Click one to open it in the playground.</p>
          </div>
          <div className={styles.gallery}>
            {gallery.map((src, i) => (
              <Stamp
                key={src}
                src={src}
                tilt={[-2, 1.5, -1, 2, -1.5][i % 5]}
                title="Open in the playground"
                onClick={() => openInPlayground(src)}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <a target="_blank" rel="noreferrer" href="https://www.baars.design/">
          Made with <span>♥</span> by baars.design
        </a>
        <a href="https://github.com/the-baaron/stamps" rel="noreferrer" target="_blank">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
