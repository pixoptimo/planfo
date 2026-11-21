import React, { useState } from 'react';
import { CMS_VERSION } from '../../utils/version.js';
import { Toast } from '../../components/DesignSystem/Toast.js';

export const DesignSystemPage: React.FC = () => {
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Interactive specimen states
  const [columnWidth, setColumnWidth] = useState(720);
  const [fontSize, setFontSize] = useState(32);
  const [dwellRange, setDwellRange] = useState({ min: 3, max: 12 });
  const [switch1, setSwitch1] = useState(true);
  const [switch2, setSwitch2] = useState(false);
  const [switch3, setSwitch3] = useState(true);
  const [radioSelected, setRadioSelected] = useState('light');
  const [tags, setTags] = useState(['DesignSystems', 'Typography', 'Brutalism', 'EditorialPrint']);
  const [viewportSegment, setViewportSegment] = useState<'desktop' | 'mobile' | 'fluid'>('desktop');
  const [alignSegment, setAlignSegment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  const copyToken = (text: string) => {
    navigator.clipboard?.writeText(text);
    setToastText(`Copied: ${text}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  return (
    <div className="flex flex-col w-full space-y-12 pb-16">
      <Toast show={showToast} message={toastText} onClose={() => setShowToast(false)} />

      {/* SECTION 1: SYSTEM OVERVIEW BANNER */}
      <section className="w-full">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-8 lg:p-12 shadow-sm border border-outline-variant/30">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute right-64 -bottom-20 w-64 h-64 rounded-full bg-secondary-container/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-xs text-label-xs uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container animate-pulse" />
                  Core System Spec 2.4
                </span>
                <span className="font-label-xs text-label-xs text-on-surface-variant font-semibold">
                  WCAG AAA Certified
                </span>
                <span className="text-outline-variant">•</span>
                <span className="font-label-xs text-label-xs text-primary font-semibold">Live Semantic Tokens</span>
              </div>

              <h1 className="font-headline-xl text-headline-xl text-on-surface font-normal tracking-tight leading-tight">
                Editorial Studio UI Components & Design System
              </h1>

              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
                Core primitives, interactive controls, form elements, and typographic scale calibrated with Violet (
                <span className="font-semibold text-primary">#6D4AFF</span>), Deep Ink (
                <span className="font-semibold text-on-surface">#201636</span>), Coral (
                <span className="font-semibold text-secondary-container">#FF6B6B</span>), and Soft Lavender (
                <span className="font-semibold text-primary-fixed-dim">#DCD4FF</span>).
              </p>

              {/* Statistics pills */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-label-md text-label-md text-on-surface font-semibold">42 Primitives</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-container" />
                  <span className="font-label-md text-label-md text-on-surface font-semibold">8 Color Tokens</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Fluid Responsive 720px Column
                  </span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Production Ready</span>
                </div>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => copyToken('--color-primary: #6D4AFF; --color-deep-ink: #201636;')}
                className="px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface hover:text-primary font-label-md text-label-md shadow-sm hover:shadow transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">data_object</span>
                <span>Copy CSS Tokens</span>
              </button>
              <div className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">sync</span>
                <span>Design System Active</span>
                <span className="w-2 h-2 rounded-full bg-surface-container-lowest animate-ping" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COLOR PALETTE & TOKENS */}
      <section className="w-full">
        <div className="flex items-center justify-between pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
                01 / Foundation
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Color Palette & Semantic Roles</h2>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant hidden sm:inline-block">
            Click any swatch to copy CSS variable
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Swatch 1 */}
          <div
            onClick={() => copyToken('--color-primary: #6D4AFF')}
            className="group cursor-pointer rounded-2xl p-3 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20"
          >
            <div className="h-28 rounded-xl bg-primary-container relative p-3 flex flex-col justify-between shadow-inner">
              <span className="font-label-xs text-label-xs text-on-primary-container px-2 py-0.5 rounded-full bg-on-primary-fixed/20 font-bold self-start">
                Brand Primary
              </span>
              <span className="material-symbols-outlined text-on-primary-container text-[18px] opacity-0 group-hover:opacity-100 transition-opacity self-end">
                content_copy
              </span>
            </div>
            <div className="pt-3">
              <div className="font-title-md text-title-md text-on-surface font-bold">Violet Primary</div>
              <div className="font-label-md text-label-md text-primary font-mono pt-0.5">#6D4AFF</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pt-1">Action & Identity</div>
            </div>
          </div>

          {/* Swatch 2 */}
          <div
            onClick={() => copyToken('--color-deep-ink: #201636')}
            className="group cursor-pointer rounded-2xl p-3 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20"
          >
            <div className="h-28 rounded-xl bg-on-surface relative p-3 flex flex-col justify-between shadow-inner">
              <span className="font-label-xs text-label-xs text-inverse-on-surface px-2 py-0.5 rounded-full bg-surface/20 font-bold self-start">
                Text High Contrast
              </span>
              <span className="material-symbols-outlined text-inverse-on-surface text-[18px] opacity-0 group-hover:opacity-100 transition-opacity self-end">
                content_copy
              </span>
            </div>
            <div className="pt-3">
              <div className="font-title-md text-title-md text-on-surface font-bold">Deep Ink</div>
              <div className="font-label-md text-label-md text-on-surface font-mono pt-0.5">#201636</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pt-1">Headings & Structure</div>
            </div>
          </div>

          {/* Swatch 3 */}
          <div
            onClick={() => copyToken('--color-secondary-coral: #FF6B6B')}
            className="group cursor-pointer rounded-2xl p-3 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20"
          >
            <div className="h-28 rounded-xl bg-secondary-container relative p-3 flex flex-col justify-between shadow-inner">
              <span className="font-label-xs text-label-xs text-white px-2 py-0.5 rounded-full bg-surface-container-lowest/40 font-bold self-start">
                Alert & Live
              </span>
              <span className="material-symbols-outlined text-white text-[18px] opacity-0 group-hover:opacity-100 transition-opacity self-end">
                content_copy
              </span>
            </div>
            <div className="pt-3">
              <div className="font-title-md text-title-md text-on-surface font-bold">Vibrant Coral</div>
              <div className="font-label-md text-label-md text-secondary font-mono pt-0.5">#FF6B6B</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pt-1">Accent & Highlights</div>
            </div>
          </div>

          {/* Swatch 4 */}
          <div
            onClick={() => copyToken('--color-lavender-dim: #DCD4FF')}
            className="group cursor-pointer rounded-2xl p-3 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20"
          >
            <div className="h-28 rounded-xl bg-surface-container-highest relative p-3 flex flex-col justify-between shadow-inner">
              <span className="font-label-xs text-label-xs text-primary px-2 py-0.5 rounded-full bg-primary/10 font-bold self-start">
                Selection
              </span>
              <span className="material-symbols-outlined text-primary text-[18px] opacity-0 group-hover:opacity-100 transition-opacity self-end">
                content_copy
              </span>
            </div>
            <div className="pt-3">
              <div className="font-title-md text-title-md text-on-surface font-bold">Soft Lavender</div>
              <div className="font-label-md text-label-md text-on-surface-variant font-mono pt-0.5">#DCD4FF</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pt-1">Interactive Focus</div>
            </div>
          </div>

          {/* Swatch 5 */}
          <div
            onClick={() => copyToken('--color-surface-tint: #F3F1FF')}
            className="group cursor-pointer rounded-2xl p-3 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20"
          >
            <div className="h-28 rounded-xl bg-surface-container-low relative p-3 flex flex-col justify-between shadow-inner">
              <span className="font-label-xs text-label-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-variant font-bold self-start">
                Background Sheet
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] opacity-0 group-hover:opacity-100 transition-opacity self-end">
                content_copy
              </span>
            </div>
            <div className="pt-3">
              <div className="font-title-md text-title-md text-on-surface font-bold">Surface Tint</div>
              <div className="font-label-md text-label-md text-on-surface-variant font-mono pt-0.5">#F3F1FF</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pt-1">Card Plates & Chips</div>
            </div>
          </div>

          {/* Swatch 6 */}
          <div
            onClick={() => copyToken('--color-surface-white: #FFFFFF')}
            className="group cursor-pointer rounded-2xl p-3 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20"
          >
            <div className="h-28 rounded-xl bg-surface-container-lowest relative p-3 flex flex-col justify-between shadow">
              <span className="font-label-xs text-label-xs text-on-surface px-2 py-0.5 rounded-full bg-surface-container font-bold self-start">
                Level 1 Sheet
              </span>
              <span className="material-symbols-outlined text-on-surface text-[18px] opacity-0 group-hover:opacity-100 transition-opacity self-end">
                content_copy
              </span>
            </div>
            <div className="pt-3">
              <div className="font-title-md text-title-md text-on-surface font-bold">Crisp Pure White</div>
              <div className="font-label-md text-label-md text-on-surface-variant font-mono pt-0.5">#FFFFFF</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pt-1">Primary Surface Canvas</div>
            </div>
          </div>

          {/* Swatch 7 */}
          <div
            onClick={() => copyToken('--color-text-secondary: #716982')}
            className="group cursor-pointer rounded-2xl p-3 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20"
          >
            <div className="h-28 rounded-xl bg-tertiary relative p-3 flex flex-col justify-between shadow-inner">
              <span className="font-label-xs text-label-xs text-on-tertiary px-2 py-0.5 rounded-full bg-on-tertiary/20 font-bold self-start">
                Metadata
              </span>
              <span className="material-symbols-outlined text-on-tertiary text-[18px] opacity-0 group-hover:opacity-100 transition-opacity self-end">
                content_copy
              </span>
            </div>
            <div className="pt-3">
              <div className="font-title-md text-title-md text-on-surface font-bold">Secondary Gray</div>
              <div className="font-label-md text-label-md text-on-surface-variant font-mono pt-0.5">#716982</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pt-1">Labels & Captions</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TYPOGRAPHY HIERARCHY */}
      <section className="w-full">
        <div className="flex items-center justify-between pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
                02 / Typography Hierarchy
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Newsreader Serif & Modern Sans UI Scale</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-xs text-label-xs font-semibold">
              Newsreader (Serif)
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-xs text-label-xs font-semibold">
              Plus Jakarta / Inter (Sans)
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm border border-outline-variant/20 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 pb-6 bg-surface-container-low/40 p-4 rounded-xl">
            <div className="w-72 shrink-0">
              <div className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Display Large</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">Newsreader • 56px / 64px • 400</div>
              <span className="inline-block mt-2 font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                display-lg
              </span>
            </div>
            <div className="grow font-display-lg text-display-lg text-on-surface tracking-tight">
              The Architecture of Modern Typography
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 pb-6">
            <div className="w-72 shrink-0">
              <div className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Headline XL / Title 1</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">Newsreader • 40px / 48px • 400</div>
              <span className="inline-block mt-2 font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                headline-xl
              </span>
            </div>
            <div className="grow font-headline-xl text-headline-xl text-on-surface">
              Editorial Cadence & Systemic Rigor
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 pb-6">
            <div className="w-72 shrink-0">
              <div className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Headline MD / Title 2</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">Newsreader • 24px / 32px • 500</div>
              <span className="inline-block mt-2 font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                headline-md
              </span>
            </div>
            <div className="grow font-headline-md text-headline-md text-on-surface">
              Token Consistency in Multi-pane Studio Workflows
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 pb-6">
            <div className="w-72 shrink-0">
              <div className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Body Large (Serif Italic)</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">Newsreader Italic • 18px / 30px</div>
              <span className="inline-block mt-2 font-label-xs text-label-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                body-lg italic
              </span>
            </div>
            <div className="grow font-body-lg text-body-lg text-on-surface-variant italic max-w-3xl">
              “An inquiry into fluid typographic rhythm, automated document compilation, and the tactile friction of generative publication layouts.”
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4">
            <div className="w-72 shrink-0">
              <div className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Metadata & Tokens</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">Plus Jakarta / JetBrains • 10px & 12px</div>
            </div>
            <div className="grow flex flex-wrap items-center gap-4">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant font-bold">
                BYLINE • 14 MIN READ • DRAFT WIP • MARCH 2026
              </span>
              <code className="px-3 py-1 rounded bg-surface-container font-code text-code text-primary font-semibold">
                font-family: var(--font-newsreader);
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: BUTTONS & INTERACTIVE CONTROLS */}
      <section className="w-full">
        <div className="flex items-center justify-between pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
                03 / Action Primitives
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Buttons & Interactive Matrix</h2>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant hidden md:inline">
            Variants: Primary, Secondary, Coral CTA, Pill, Icon, Segmented
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Card: Primary Solid Violet */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-on-surface">Primary Solid Violet</span>
                <span className="px-2 py-0.5 rounded text-label-xs font-label-xs bg-primary-container text-on-primary-container">
                  #6D4AFF
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
                High-priority singular triggers, publishing, and primary actions.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="h-10 px-5 rounded-lg bg-primary-container text-on-primary-container font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all flex items-center gap-2"
                >
                  <span>Publish Issue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  className="h-9 px-3.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md shadow-sm hover:bg-primary transition-all"
                >
                  Medium Button
                </button>
              </div>
            </div>
          </div>

          {/* Card: Secondary Lavender */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-on-surface">Secondary Lavender</span>
                <span className="px-2 py-0.5 rounded text-label-xs font-label-xs bg-surface-container-high text-primary">
                  #F3F1FF
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
                Secondary canvas workflows, contextual toolbars, and filters.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="h-10 px-5 rounded-lg bg-surface-container text-primary font-label-lg text-label-lg hover:bg-surface-container-high transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">history_edu</span>
                <span>Revision History</span>
              </button>
              <button
                type="button"
                className="h-9 px-3.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-all"
              >
                Inspect Layout
              </button>
            </div>
          </div>

          {/* Card: Coral Alert CTA */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-on-surface">Coral Accent & Alert CTA</span>
                <span className="px-2 py-0.5 rounded text-label-xs font-label-xs bg-secondary-fixed text-on-secondary-container">
                  #FF6B6B
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
                Destructive confirmations, live actions, urgent warnings.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="h-10 px-5 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                <span>Go Live Stream</span>
              </button>
              <button
                type="button"
                className="h-9 px-3 rounded-lg bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Discard Draft</span>
              </button>
            </div>
          </div>

          {/* Card: Pills */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-on-surface">Pill Buttons (9999px)</span>
                <span className="px-2 py-0.5 rounded text-label-xs font-label-xs bg-surface-container text-on-surface-variant">
                  rounded-full
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
                Floating canvas insets, quick-add blocks, and drawer triggers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="h-10 px-5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md shadow-sm hover:shadow flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>+ New Block</span>
              </button>
              <button
                type="button"
                className="h-10 px-5 rounded-full bg-surface-container-highest text-primary font-label-md text-label-md hover:bg-surface-container-high transition-all flex items-center gap-1.5"
              >
                <span>Publish Issue</span>
                <span className="material-symbols-outlined text-[16px]">north_east</span>
              </button>
            </div>
          </div>

          {/* Card: Icon Utility Controls */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-on-surface">Icon Utility Buttons</span>
                <span className="px-2 py-0.5 rounded text-label-xs font-label-xs bg-surface-container text-on-surface-variant">
                  40x40 Square
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
                Header controls, formatting toolbars, and inspector toggles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
              </button>
              <button type="button" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
              <button type="button" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-[20px]">undo</span>
              </button>
              <button type="button" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-[20px]">redo</span>
              </button>
            </div>
          </div>

          {/* Card: Segmented Controls */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-on-surface">Segmented Button Groups</span>
                <span className="px-2 py-0.5 rounded text-label-xs font-label-xs bg-surface-container text-on-surface-variant">
                  Radio Segment
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
                Viewport simulation and text alignment selectors.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-1 rounded-xl bg-surface-container flex items-center">
                <button
                  type="button"
                  onClick={() => setViewportSegment('desktop')}
                  className={`flex-1 py-1.5 rounded-lg font-label-xs text-label-xs font-semibold text-center transition-all ${
                    viewportSegment === 'desktop' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Desktop 720px
                </button>
                <button
                  type="button"
                  onClick={() => setViewportSegment('mobile')}
                  className={`flex-1 py-1.5 rounded-lg font-label-xs text-label-xs font-semibold text-center transition-all ${
                    viewportSegment === 'mobile' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Mobile 390px
                </button>
                <button
                  type="button"
                  onClick={() => setViewportSegment('fluid')}
                  className={`flex-1 py-1.5 rounded-lg font-label-xs text-label-xs font-semibold text-center transition-all ${
                    viewportSegment === 'fluid' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Fluid Full
                </button>
              </div>

              <div className="p-1 rounded-xl bg-surface-container flex items-center">
                <button
                  type="button"
                  onClick={() => setAlignSegment('left')}
                  className={`p-2 rounded-lg flex-1 flex justify-center ${
                    alignSegment === 'left' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">format_align_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignSegment('center')}
                  className={`p-2 rounded-lg flex-1 flex justify-center ${
                    alignSegment === 'center' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">format_align_center</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignSegment('right')}
                  className={`p-2 rounded-lg flex-1 flex justify-center ${
                    alignSegment === 'right' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">format_align_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SLIDERS & PRECISION CONTROLS */}
      <section className="w-full">
        <div className="flex items-center justify-between pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
                04 / Precision Controls
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Sliders & Seekbars Matrix</h2>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant hidden md:inline">
            Column Width, Scale Steppers, Scrubbing Tracks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column Measure Slider */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-title-md text-title-md text-on-surface font-semibold">Reading Column Measure</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Desktop optimal typographic column (540px - 860px)</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-xs text-label-xs font-bold shadow-sm">
                {columnWidth} px Active
              </span>
            </div>
            <div className="space-y-4 pt-2">
              <input
                type="range"
                min="540"
                max="860"
                value={columnWidth}
                onChange={(e) => setColumnWidth(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container-high rounded-full cursor-pointer"
              />
              <div className="flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant font-mono">
                <span>Min 540px</span>
                <span className="font-bold text-primary">Target: 720px (65 CPL)</span>
                <span>Max 860px</span>
              </div>
            </div>
          </div>

          {/* Font Size Stepper */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-title-md text-title-md text-on-surface font-semibold">Display Font Scale</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Step: 4px increments (12px to 48px)</div>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFontSize(Math.max(12, fontSize - 4))}
                  className="w-6 h-6 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center font-bold text-body-sm hover:text-primary"
                >
                  -
                </button>
                <span className="font-label-md text-label-md font-mono px-2 text-on-surface font-bold">
                  {fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => setFontSize(Math.min(48, fontSize + 4))}
                  className="w-6 h-6 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center font-bold text-body-sm hover:text-primary"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <input
                type="range"
                min="12"
                max="48"
                step="4"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container-high rounded-full cursor-pointer"
              />
              <div className="flex justify-between px-1">
                <span className="w-1 h-2 bg-on-surface-variant/30 rounded-full" />
                <span className="w-1 h-2 bg-on-surface-variant/30 rounded-full" />
                <span className="w-1 h-2 bg-primary rounded-full" />
                <span className="w-1 h-2 bg-on-surface-variant/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: TOGGLES & SELECTION CONTROLS */}
      <section className="w-full">
        <div className="flex items-center justify-between pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
                05 / Selection Controls
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Toggles, Checkboxes & Radio Matrices</h2>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant hidden md:inline">
            Checked, Unchecked, Indeterminate, Disabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Switches */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 space-y-6">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">iOS / Fluid Pill Switches</h3>
            <div className="space-y-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSwitch1(!switch1)}
              >
                <div>
                  <span className="font-label-md text-label-md text-on-surface font-semibold block">Auto-compile Layout</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Continuous serif layout parsing</span>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${switch1 ? 'bg-primary-container justify-end' : 'bg-surface-container justify-start'}`}>
                  <div className="w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm" />
                </div>
              </div>

              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSwitch2(!switch2)}
              >
                <div>
                  <span className="font-label-md text-label-md text-on-surface font-semibold block">Public Syndication</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Broadcast to RSS feed</span>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${switch2 ? 'bg-primary-container justify-end' : 'bg-surface-container justify-start'}`}>
                  <div className="w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm" />
                </div>
              </div>

              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSwitch3(!switch3)}
              >
                <div>
                  <span className="font-label-md text-label-md text-secondary font-semibold block">Coral Alert Stream</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Breaking banner overlay</span>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${switch3 ? 'bg-secondary-container justify-end' : 'bg-surface-container justify-start'}`}>
                  <div className="w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Radios */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 space-y-6">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">Concentric Radio Selector</h3>
            <div className="space-y-3">
              {[
                { id: 'light', title: 'Light Editorial (Default)', desc: 'Pure paper canvas (#FFFFFF) with high contrast text' },
                { id: 'sepia', title: 'Warm Sepia Bookcraft', desc: 'Warm tinted page emulation for prolonged reading' },
                { id: 'nocturne', title: 'Deep Ink Nocturne', desc: 'Inverted midnight contrast with violet luminance' }
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setRadioSelected(opt.id)}
                  className={`flex items-start gap-3 cursor-pointer p-2.5 rounded-xl transition-colors ${
                    radioSelected === opt.id ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div
                    className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0 ${
                      radioSelected === opt.id ? 'bg-surface-container-lowest shadow ring-2 ring-primary' : 'bg-surface-container'
                    }`}
                  >
                    {radioSelected === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <span className={`font-label-md text-label-md font-semibold block ${radioSelected === opt.id ? 'text-primary' : 'text-on-surface'}`}>
                      {opt.title}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Badges & Tags */}
          <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 space-y-6">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">Taxonomy & Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-primary font-label-xs text-label-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Published
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-xs text-label-xs font-medium">
                Draft Saved
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-xs text-label-xs font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Live Breaking
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-on-surface text-inverse-on-surface font-label-md text-label-md font-medium shadow-sm"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((tag) => tag !== t))}
                    className="hover:text-secondary-fixed"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full pt-4">
        <div className="p-8 rounded-2xl bg-surface-container-high/50 border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">Planfo Design System v{CMS_VERSION}</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Validated for high-velocity multi-pane publication desktops, newsrooms, and longform reading canvases.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface hover:text-primary font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            <span>Back to Top</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

