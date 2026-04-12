const features = [
  { emoji: "🎯", title: "Set Your Goal", desc: "Define what matters most to you and commit to it.", color: "hsla(258, 100%, 62%, 0.15)" },
  { emoji: "🤝", title: "Find Your GoalMate", desc: "Get matched with someone chasing the same dream.", color: "hsla(0, 100%, 71%, 0.12)" },
  { emoji: "🔥", title: "Build Your Streak", desc: "Stay consistent together and never break the chain.", color: "hsla(40, 100%, 60%, 0.12)" },
];

const FeatureCards = () => (
  <section className="relative z-10 px-6 pb-28 pt-12">
    <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={f.title}
          className={`glass-card-glow p-8 text-center fade-up fade-up-delay-${i + 3} cursor-default group`}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ background: f.color }}
          >
            {f.emoji}
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FeatureCards;
