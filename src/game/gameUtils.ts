/**
 * https://stackoverflow.com/a/16599668
 */
export function getBrokenLinesForCanvas(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number
) {
	var words = text.split(" ")
	var lines = []
	var currentLine = words[0]

	for (var i = 1; i < words.length; i++) {
		var word = words[i]
		var width = ctx.measureText(currentLine + " " + word).width
		if (width < maxWidth) {
			currentLine += " " + word
		} else {
			lines.push(currentLine)
			currentLine = word
		}
	}
	lines.push(currentLine)
	return lines
}
