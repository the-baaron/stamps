import Head from "next/head";
import React, { useState } from "react";
import styles from "../styles/Home.module.css";

import { allowedFonts } from "helpers/generateSVG/types";
import { API, parseStampPath } from "helpers/stamp";
import { Playground, Preset } from "components/Playground";
import { Snippet } from "components/Snippet";
import { Stamp } from "components/Stamp";

const fonts = Object.keys(allowedFonts).filter((v) => isNaN(Number(v)));

const heroStamps = [
  "Read%20the%20docs?icon=book&backgroundColor=121212&padding=10&borderRadius=6",
  "Download?icon=download&backgroundColor=E5484D&padding=10&borderRadius=6",
  "Star%20on%20GitHub?icon=github&backgroundColor=white&color=121212&borderWidth=1&borderColor=121212&padding=10&borderRadius=6",
  "Sponsor?icon=heart&iconStyle=regular&backgroundColor=FFE4E1&color=C2185B&padding=10&borderRadius=20",
  "Live%20demo?icon=arrow-right&iconPosition=after&backgroundColor=0794e0&padding=10&borderRadius=6",
];

const gallery = [
  "Example?borderWidth=2&borderColor=2B303A&backgroundColor=white&color=2B303A",
  "Example?backgroundColor=BAC1B8&color=2B303A&borderRadius=0&fontSize=20&fontFamily=courier%20new",
  "Example?backgroundColor=0C7C59&color=white&borderRadius=50&fontFamily=andale%20mono",
  "Example?borderRadius=16&fontFamily=comic%20sans%20ms&backgroundColor=FF7F51",
  "Button%20with%20a%20very%20long%20text%20in%20it?backgroundColor=eee&borderWidth=1&borderColor=ccc&color=000",
  "Install?icon=terminal&backgroundColor=1E1E1E&color=7CFC9A&fontFamily=courier%20new&padding=10&borderRadius=4",
  "Discord?icon=discord&backgroundColor=5865F2&padding=10&borderRadius=8",
  "Buy%20me%20a%20coffee?icon=mug-hot&backgroundColor=FFDD00&color=121212&padding=10&borderRadius=8",
  "Changelog?icon=clock-rotate-left&iconStyle=solid&backgroundColor=F4F0EA&color=121212&borderWidth=1&borderColor=121212&padding=8&borderRadius=0",
  "Next?icon=arrow-right&iconPosition=after&backgroundColor=6D28D9&padding=10&borderRadius=30",
];

interface Param {
  names: string[];
  defaults: string[];
  body: React.ReactNode;
  examples: string[];
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
    examples: ["Example?fontFamily=impact"],
  },
  {
    names: ["fontSize"],
    defaults: ["14"],
    body: "Text size in pixels. The icon scales with it.",
    examples: ["Example?fontSize=30"],
  },
  {
    names: ["borderRadius"],
    defaults: ["4"],
    body: "Corner rounding in pixels.",
    examples: ["Example?borderRadius=16"],
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
    examples: ["Example?backgroundColor=0C7C59"],
  },
  {
    names: ["color"],
    defaults: ["white"],
    body: "Colour of the text and the icon. Names and hex values both work.",
    examples: ["Example?backgroundColor=2B303A&color=FFD166"],
  },
  {
    names: ["borderWidth", "borderColor"],
    defaults: ["0", "0b76b0"],
    body: "Border thickness in pixels, and its colour.",
    examples: ["Example?borderWidth=3&borderColor=58A4B0"],
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
    examples: ["Example?padding=20"],
  },
  {
    names: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
    defaults: ["8", "16", "8", "16"],
    body: "Space on one side only.",
    examples: ["Example?paddingLeft=40", "Example?paddingTop=20"],
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
    examples: ["Example?icon=heart", "GitHub?icon=github&backgroundColor=24292f"],
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
    examples: ["Example?icon=heart&iconStyle=regular"],
  },
  {
    names: ["iconPosition"],
    defaults: ["before"],
    body: (
      <>
        <code>before</code> or <code>after</code> the text.
      </>
    ),
    examples: ["Next?icon=arrow-right&iconPosition=after"],
  },
];

export default function Home() {
  const [preset, setPreset] = useState<Preset>();

  const openInPlayground = (path: string) => {
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
                  {p.examples.map((src) => (
                    <button
                      type="button"
                      key={src}
                      className={styles.paramExample}
                      onClick={() => openInPlayground(src)}
                      title="Open in the playground"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${API}${src}`} alt={`Example: ${src}`} />
                      <code>?{src.split("?")[1]}</code>
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
