const utils = {
  formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  },
  formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(date);
  },
  feetStringToCm(feetString: string): number {
    const parts = feetString.split("'");
    if (parts.length !== 2) {
      throw new Error("Invalid feet string format");
    }
    const feet = parseInt(parts[0] || "0", 10);
    const inches = parseInt((parts[1] || "0").replace('"', ""), 10);
    return Math.round((feet * 12 + inches) * 2.54);
  },
  // This is terrible and uses the deprecated `document.execCommand`,
  // but it's the best way to insert plain text into a contenteditable element
  insertPlainText(text: string) {
    document.execCommand("insertText", false, text);
  },
};

export default utils;
