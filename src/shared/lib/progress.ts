export function calcRemainingToday(
    dailyLimit: number,
    passedBefore: number,
    correctNow: number
) {
    const safeLimit = Math.max(0, dailyLimit);
    const totalDone = Math.min(
        safeLimit,
        Math.max(0, passedBefore) + Math.max(0, correctNow)
    );
    const remaining = Math.max(0, safeLimit - totalDone);
    return { remaining, totalDone };
}