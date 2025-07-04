const utils = {
  formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  },
  feetStringToCm(feetString: string): number {
    const parts = feetString.split('\'');
    if (parts.length !== 2) {
      throw new Error('Invalid feet string format');
    }
    const feet = parseInt(parts[0], 10);
    const inches = parseInt(parts[1].replace('"', ''), 10);
    return Math.round((feet * 12 + inches) * 2.54);
  }
};

export default utils;
