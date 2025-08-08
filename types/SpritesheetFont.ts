export interface CharacterBounds {
    left: number;
    top: number;
    width: number;
    height: number;
    baselineOffset: number;
}

export interface FontStyleData {
    imagePath: string;
    characterWidth: number;
    characterHeight: number;
    spritesheetColumns: number;
    spritesheetRows: number;
    characters: string;
    characterBounds: Record<string, CharacterBounds>;
    kerningPairs?: Record<string, number>;
}

export interface FontData {
    name: string;
    styles: Record<string, FontStyleData>;
    defaultStyle: string;
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
    private characterPositions: Record<string, Record<string, { x: number; y: number }>> = {};
    private currentStyle: string;

    constructor(fontData: FontData, defaultStyle?: string) {
        this.fontData = fontData;
        this.currentStyle = defaultStyle || fontData.defaultStyle;
        this.calculateCharacterPositions();
    }

    private calculateCharacterPositions(): void {
        for (const [styleName, styleData] of Object.entries(this.fontData.styles)) {
            this.characterPositions[styleName] = {};
            for (let i = 0; i < styleData.characters.length; i++) {
                const char = styleData.characters[i];
                if (typeof char !== 'undefined') {
                    const x = (i % styleData.spritesheetColumns) * styleData.characterWidth;
                    const y = Math.floor(i / styleData.spritesheetColumns) * styleData.characterHeight;
                    this.characterPositions[styleName][char] = { x, y };
                }
            }
        }
    }

    setStyle(styleName: string): void {
        if (this.fontData.styles[styleName]) {
            this.currentStyle = styleName;
        } else {
            console.warn(`Font style "${styleName}" not found. Available styles: ${Object.keys(this.fontData.styles).join(', ')}`);
        }
    }

    getAvailableStyles(): string[] {
        return Object.keys(this.fontData.styles);
    }

    getCurrentStyle(): string {
        return this.currentStyle;
    }

    getKerning(leftChar: string, rightChar: string, styleName?: string): number {
        const style = styleName || this.currentStyle;
        const styleData = this.fontData.styles[style];
        if (!styleData?.kerningPairs) return 0;
        const pairKey = leftChar + rightChar;
        return styleData.kerningPairs[pairKey] || 0;
    }

    getCharacterStyle(char: string, scale: number = 1, spacing: number = 0, size?: string, nextChar?: string, styleName?: string): CharacterStyle {
        const style = styleName || this.currentStyle;
        const styleData = this.fontData.styles[style];
        
        if (!styleData) {
            console.warn(`Font style "${style}" not found. Using default style.`);
            const defaultStyleData = this.fontData.styles[this.fontData.defaultStyle];
            return this.getCharacterStyle(char, scale, spacing, size, nextChar, this.fontData.defaultStyle);
        }

        const { x, y } = this.characterPositions[style]?.[char] || { x: 0, y: 0 };
        const bounds = styleData.characterBounds[char] || 
                      styleData.characterBounds[' '] || 
                      { left: 0, top: 0, width: styleData.characterWidth, height: styleData.characterHeight, baselineOffset: 0 };
        
        // If size is provided, use it directly; otherwise calculate from scale
        let finalWidth: string;
        let finalHeight: string;
        let finalScale: number;
        
        if (size) {
            // When size is provided, calculate the scale factor based on the font's overall character height
            const sizeValue = parseFloat(size);
            const sizeUnit = size.replace(sizeValue.toString(), '');
            finalScale = sizeValue / styleData.characterHeight;
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
            `${styleData.spritesheetColumns * styleData.characterWidth * finalScale}${size.replace(parseFloat(size).toString(), '')}` :
            `${styleData.spritesheetColumns * styleData.characterWidth * finalScale}px`;
        const maskSizeHeight = size ?
            `${styleData.spritesheetRows * styleData.characterHeight * finalScale}${size.replace(parseFloat(size).toString(), '')}` :
            `${styleData.spritesheetRows * styleData.characterHeight * finalScale}px`;
        
        // Calculate kerning adjustment if nextChar is provided
        let kerningAdjustment = 0;
        if (nextChar) {
            kerningAdjustment = this.getKerning(char, nextChar, style) * finalScale;
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
            maskImage: `url(${styleData.imagePath})`,
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

    getSpaceStyle(scale: number = 1, spacing: number = 0, size?: string, styleName?: string): SpaceStyle {
        const style = styleName || this.currentStyle;
        const styleData = this.fontData.styles[style];
        
        if (!styleData) {
            console.warn(`Font style "${style}" not found. Using default style.`);
            return this.getSpaceStyle(scale, spacing, size, this.fontData.defaultStyle);
        }

        const bounds = styleData.characterBounds[' '] || { left: 0, top: 0, width: 32, height: 64, baselineOffset: 0 };
        
        // If size is provided, use it directly; otherwise calculate from scale
        let finalWidth: string;
        let finalHeight: string;
        
        if (size) {
            // When size is provided, calculate the scale factor based on the font's overall character height
            // This ensures consistent scaling with getCharacterStyle
            const sizeValue = parseFloat(size);
            const sizeUnit = size.replace(sizeValue.toString(), '');
            const calculatedScale = sizeValue / styleData.characterHeight;
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

    splitTextIntoLines(text: string, styleName?: string): string[][] {
        const style = styleName || this.currentStyle;
        const styleData = this.fontData.styles[style];
        
        if (!styleData) {
            console.warn(`Font style "${style}" not found. Using default style.`);
            return this.splitTextIntoLines(text, this.fontData.defaultStyle);
        }

        return text.split('\n').map(line => {
            return line.split('').filter(char => styleData.characters.includes(char) || char === ' ');
        });
    }

    getTextStyles(text: string, scale: number = 1, spacing: number = 0, size?: string, styleName?: string): (CharacterStyle | SpaceStyle)[] {
        const style = styleName || this.currentStyle;
        const chars = text.split('');
        return chars.map((char, index) => {
            const nextChar = index < chars.length - 1 ? chars[index + 1] : undefined;
            
            if (char === ' ') {
                return this.getSpaceStyle(scale, spacing, size, style);
            } else {
                return this.getCharacterStyle(char, scale, spacing, size, nextChar, style);
            }
        });
    }

    get name(): string {
        return this.fontData.name;
    }

    get characters(): string {
        const styleData = this.fontData.styles[this.currentStyle];
        return styleData?.characters || '';
    }
}
