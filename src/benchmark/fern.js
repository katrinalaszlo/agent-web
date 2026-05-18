export async function runFern(url) {
  try {
    const { runChecks, computeScore, toGrade, CATEGORIES } =
      await import("afdocs");

    const report = await runChecks(url);
    const checks = report.results || [];
    const computed = computeScore(report);
    const score = computed.overall ?? 0;
    const maxScore = 100;
    const grade = computed.grade || toGrade(score);

    const catMap = {};
    for (const cat of CATEGORIES) {
      catMap[cat.id] = { name: cat.name, score: 0, maxScore: 0 };
    }

    for (const check of checks) {
      const catId = check.category || "other";
      if (!catMap[catId]) {
        catMap[catId] = { name: catId, score: 0, maxScore: 0 };
      }
      catMap[catId].maxScore += 1;
      if (check.status === "pass") catMap[catId].score += 1;
    }

    for (const cat of Object.values(catMap)) {
      cat.percentage =
        cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
    }

    const categories = Object.fromEntries(
      Object.entries(catMap).filter(([, v]) => v.maxScore > 0),
    );

    return {
      score,
      maxScore,
      grade,
      categories,
      available: true,
    };
  } catch (err) {
    return { available: false, reason: err.message?.slice(0, 100) };
  }
}
