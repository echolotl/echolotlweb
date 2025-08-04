export interface CharacterBounds {
    left: number;
    top: number;
    width: number;
    height: number;
    baselineOffset: number;
}

export interface FontData {
    name: string;
    imagePath: string;
    characterWidth: number;
    characterHeight: number;
    spritesheetColumns: number;
    spritesheetRows: number;
    characters: string;
    characterBounds: Record<string, CharacterBounds>;
    kerningPairs?: Record<string, number>;
}

export interface CharacterStyle {
    width: string;
    height: string;
    backgroundColor: string;
    maskImage: string;
    maskPosition: string;
    maskSize: string;
    display: string;
    marginRight?: string;
    transform?: string;
    verticalAlign: string;
    [key: string]: string | undefined;
}

export interface SpaceStyle {
    width: string;
    height: string;
    display: string;
    marginRight?: string;
    verticalAlign: string;
    [key: string]: string | undefined;
}

export class SpritesheetFont {
    private fontData: FontData;
    private characterPositions: Record<string, { x: number; y: number }> = {};

    constructor(fontData: FontData) {
        this.fontData = fontData;
        this.calculateCharacterPositions();
    }

    private calculateCharacterPositions(): void {
        for (let i = 0; i < this.fontData.characters.length; i++) {
            const char = this.fontData.characters[i];
            if (typeof char !== 'undefined') {
                const x = (i % this.fontData.spritesheetColumns) * this.fontData.characterWidth;
                const y = Math.floor(i / this.fontData.spritesheetColumns) * this.fontData.characterHeight;
                this.characterPositions[char] = { x, y };
            }
        }
    }

    getKerning(leftChar: string, rightChar: string): number {
        if (!this.fontData.kerningPairs) return 0;
        const pairKey = leftChar + rightChar;
        return this.fontData.kerningPairs[pairKey] || 0;
    }

    getCharacterStyle(char: string, scale: number = 1, spacing: number = 0, size?: string, nextChar?: string): CharacterStyle {
        const { x, y } = this.characterPositions[char] || { x: 0, y: 0 };
        const bounds = this.fontData.characterBounds[char] || 
                      this.fontData.characterBounds[' '] || 
                      { left: 0, top: 0, width: this.fontData.characterWidth, height: this.fontData.characterHeight, baselineOffset: 0 };
        
        // If size is provided, use it directly; otherwise calculate from scale
        let finalWidth: string;
        let finalHeight: string;
        let finalScale: number;
        
        if (size) {
            // When size is provided, calculate the scale factor based on the font's overall character height
            const sizeValue = parseFloat(size);
            const sizeUnit = size.replace(sizeValue.toString(), '');
            finalScale = sizeValue / this.fontData.characterHeight;
            finalWidth = `${bounds.width * finalScale}${sizeUnit}`;
            finalHeight = `${bounds.height * finalScale}${sizeUnit}`;
        } else {
            // If size is not provided, use the scale directly
            finalScale = scale;
            finalWidth = `${bounds.width * scale}px`;
            finalHeight = `${bounds.height * scale}px`;
        }
        
        const scaledBaselineOffset = bounds.baselineOffset * finalScale;
        const maskPositionX = size ? 
            `-${(x + bounds.left) * finalScale}${size.replace(parseFloat(size).toString(), '')}` :
            `-${(x + bounds.left) * finalScale}px`;
        const maskPositionY = size ?
            `-${(y + bounds.top) * finalScale}${size.replace(parseFloat(size).toString(), '')}` :
            `-${(y + bounds.top) * finalScale}px`;
        const maskSizeWidth = size ?
            `${this.fontData.spritesheetColumns * this.fontData.characterWidth * finalScale}${size.replace(parseFloat(size).toString(), '')}` :
            `${this.fontData.spritesheetColumns * this.fontData.characterWidth * finalScale}px`;
        const maskSizeHeight = size ?
            `${this.fontData.spritesheetRows * this.fontData.characterHeight * finalScale}${size.replace(parseFloat(size).toString(), '')}` :
            `${this.fontData.spritesheetRows * this.fontData.characterHeight * finalScale}px`;
        
        // Calculate kerning adjustment if nextChar is provided
        let kerningAdjustment = 0;
        if (nextChar) {
            kerningAdjustment = this.getKerning(char, nextChar) * finalScale;
        }
        
        // Calculate final margin including spacing and kerning
        let finalMarginRight: string | undefined;
        if (spacing > 0 || kerningAdjustment !== 0) {
            const totalAdjustment = spacing + kerningAdjustment;
            if (size) {
                const sizeUnit = size.replace(parseFloat(size).toString(), '');
                finalMarginRight = `${totalAdjustment}${sizeUnit}`;
            } else {
                finalMarginRight = `${totalAdjustment}px`;
            }
        }
        
        return {
            width: finalWidth,
            height: finalHeight,
            backgroundColor: 'currentColor',
            maskImage: `url(${this.fontData.imagePath})`,
            maskPosition: `${maskPositionX} ${maskPositionY}`,
            maskSize: `${maskSizeWidth} ${maskSizeHeight}`,
            display: 'inline-block',
            marginRight: finalMarginRight,
            transform: scaledBaselineOffset !== 0 ? 
                (size ? `translateY(${scaledBaselineOffset}${size.replace(parseFloat(size).toString(), '')})` : `translateY(${scaledBaselineOffset}px)`) : 
                undefined,
            verticalAlign: 'baseline'
        };
    }

    getSpaceStyle(scale: number = 1, spacing: number = 0, size?: string): SpaceStyle {
        const bounds = this.fontData.characterBounds[' '] || { left: 0, top: 0, width: 32, height: 64, baselineOffset: 0 };
        
        // If size is provided, use it directly; otherwise calculate from scale
        let finalWidth: string;
        let finalHeight: string;
        
        if (size) {
            // When size is provided, calculate the scale factor based on the font's overall character height
            // This ensures consistent scaling with getCharacterStyle
            const sizeValue = parseFloat(size);
            const sizeUnit = size.replace(sizeValue.toString(), '');
            const calculatedScale = sizeValue / this.fontData.characterHeight;
            finalWidth = `${bounds.width * calculatedScale}${sizeUnit}`;
            finalHeight = `${bounds.height * calculatedScale}${sizeUnit}`;
        } else {
            finalWidth = `${bounds.width * scale}px`;
            finalHeight = `${bounds.height * scale}px`;
        }
        
        return {
            width: finalWidth,
            height: finalHeight,
            display: 'inline-block',
            marginRight: spacing > 0 ? `${spacing}px` : undefined,
            verticalAlign: 'baseline'
        };
    }

    splitTextIntoLines(text: string): string[][] {
        return text.split('\n').map(line => {
            return line.split('').filter(char => this.fontData.characters.includes(char) || char === ' ');
        });
    }

    getTextStyles(text: string, scale: number = 1, spacing: number = 0, size?: string): (CharacterStyle | SpaceStyle)[] {
        const chars = text.split('');
        return chars.map((char, index) => {
            const nextChar = index < chars.length - 1 ? chars[index + 1] : undefined;
            
            if (char === ' ') {
                return this.getSpaceStyle(scale, spacing, size);
            } else {
                return this.getCharacterStyle(char, scale, spacing, size, nextChar);
            }
        });
    }

    get name(): string {
        return this.fontData.name;
    }

    get characters(): string {
        return this.fontData.characters;
    }
}
