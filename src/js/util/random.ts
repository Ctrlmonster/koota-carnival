export function between(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

export function randomHSL() {
	return `hsl(${Math.random() * 360}, 100%, 50%)`;
}