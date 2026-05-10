(function () {
  const e = window.React?.createElement;
  let root;

  function featureList(items) {
    return e(
      "ul",
      { className: "mt-6 space-y-3 text-sm leading-6 text-stone-600" },
      items.map((item) => e("li", { key: item, className: "flex gap-3" },
        e("span", { className: "mt-2 h-1.5 w-1.5 flex-none rounded-full bg-stone-400" }),
        e("span", null, item)
      ))
    );
  }

  function progress(label, current, max) {
    const pct = Math.min(100, Math.round((current / max) * 100));
    return e("div", { className: "rounded-none border border-stone-200 bg-[#fffdf8]/80 p-4" },
      e("div", { className: "mb-3 flex items-center justify-between gap-4 font-sans text-sm text-stone-600" },
        e("span", { className: "font-semibold text-stone-700" }, label),
        e("span", null, `${current} / ${max}`)
      ),
      e("div", { className: "h-2 overflow-hidden border border-stone-200 bg-[#f1eadf]" },
        e("div", { className: "h-full bg-gradient-to-r from-[#9fae9b] to-[#b18475] transition-all duration-300", style: { width: `${pct}%` } })
      )
    );
  }

  function PlanCard({ plan, currentTier, onUpgrade }) {
    const isCurrent = plan.id === currentTier;
    const isCollector = plan.id === "collector";
    return e("article", {
      className: [
        "relative flex h-full flex-col border bg-[#fffdf8]/90 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md",
        isCollector ? "border-[#9fae9b] ring-1 ring-[#9fae9b]/40" : "border-stone-200"
      ].join(" ")
    },
      isCollector && e("span", {
        className: "absolute right-4 top-4 border border-[#d9c58f] bg-[#f1eadf] px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-[#65735f]"
      }, "Most Popular"),
      e("p", { className: "font-sans text-xs font-bold uppercase tracking-[0.18em] text-stone-500" }, plan.label),
      e("div", { className: "mt-5 flex items-end gap-2" },
        e("span", { className: "text-4xl text-stone-800" }, plan.price),
        plan.period && e("span", { className: "pb-1 font-sans text-sm text-stone-500" }, plan.period)
      ),
      featureList(plan.features),
      e("button", {
        className: [
          "mt-8 min-h-11 w-full border px-4 py-3 font-sans text-sm font-semibold transition duration-200",
          isCurrent
            ? "cursor-default border-stone-200 bg-[#f1eadf] text-stone-500"
            : isCollector
              ? "border-[#342f2b] bg-[#342f2b] text-[#fffdf8] hover:bg-[#4a433d]"
              : "border-[#342f2b] bg-[#fffdf8] text-[#342f2b] hover:bg-[#342f2b] hover:text-[#fffdf8]"
        ].join(" "),
        disabled: isCurrent,
        onClick: () => onUpgrade(plan.id)
      }, isCurrent ? "Current Plan" : plan.id === "free" ? "Downgrade to Free" : plan.cta)
    );
  }

  function Paywall({ usage, currentTier, onUpgrade, onContinue }) {
    const plans = [
      {
        id: "free",
        label: "Free",
        price: "$0",
        features: ["50 photos", "1 circle", "10 members per circle"],
        cta: "Downgrade to Free"
      },
      {
        id: "creator",
        label: "Creator",
        price: "$6",
        period: "/month",
        features: ["300 photos", "Up to 3 circles", "12 members per circle", "Basic archive filters"],
        cta: "Upgrade to Creator"
      },
      {
        id: "collector",
        label: "Collector",
        price: "$15",
        period: "/month",
        features: ["1000 photos", "Up to 6 circles", "15 members per circle", "Advanced archive filters", "Exclusive prompts"],
        cta: "Upgrade to Collector"
      }
    ];

    return e("div", { className: "mx-auto max-w-6xl px-0 py-2 text-[#342f2b] sm:px-2" },
      e("section", { className: "mx-auto max-w-3xl text-center" },
        e("p", { className: "font-sans text-xs font-bold uppercase tracking-[0.18em] text-stone-500" }, "Ephemera 365"),
        e("h1", { className: "mt-4 text-5xl leading-none sm:text-6xl" }, "Keep Creating"),
        e("p", { className: "mx-auto mt-5 max-w-2xl font-sans text-lg leading-8 text-stone-600" },
          "You’ve filled your current archive. Your work deserves more space to grow."
        )
      ),
      e("section", { className: "mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2" },
        progress("Photos", usage.photos, usage.photoLimit),
        progress("Circles", usage.circles, usage.circleLimit)
      ),
      e("section", { className: "mt-10 grid gap-5 lg:grid-cols-3" },
        plans.map((plan) => e(PlanCard, { key: plan.id, plan, currentTier, onUpgrade }))
      ),
      e("section", { className: "mx-auto mt-12 max-w-3xl border border-stone-200 bg-[#fffdf8]/70 p-7 text-center" },
        e("p", { className: "text-2xl leading-9 text-stone-800" },
          "This isn’t just storage.", e("br"), "It’s a place to track your growth, preserve your work, and share with people who understand your creativity."
        )
      ),
      e("section", { className: "mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-3 font-sans text-sm text-stone-600 sm:flex-row sm:gap-8" },
        ["Cancel anytime", "Your work is always yours", "No ads, ever"].map((item) =>
          e("div", { key: item, className: "flex items-center gap-2" },
            e("span", { className: "h-1.5 w-1.5 rounded-full bg-[#9fae9b]" }),
            e("span", null, item)
          )
        )
      ),
      e("div", { className: "mt-10 text-center" },
        e("button", {
          className: "font-sans text-sm font-semibold text-stone-500 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-800",
          onClick: onContinue
        }, "Continue with Free Plan")
      )
    );
  }

  window.EphemeraPaywall = {
    renderPaywall(node, props) {
      if (!window.React || !window.ReactDOM || !e || !node) return false;
      root = root || window.ReactDOM.createRoot(node);
      root.render(e(Paywall, props));
      return true;
    }
  };
})();
