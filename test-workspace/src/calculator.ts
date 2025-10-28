/**
 * 計算機クラス
 */
export class Calculator {
  /**
   * 加算
   */
  add(a: number, b: number): number {
    return this.validate(a) && this.validate(b) ? a + b : 0;
  }

  /**
   * 減算
   */
  subtract(a: number, b: number): number {
    return this.validate(a) && this.validate(b) ? a - b : 0;
  }

  /**
   * 乗算
   */
  multiply(a: number, b: number): number {
    return this.validate(a) && this.validate(b) ? a * b : 0;
  }

  /**
   * 除算
   */
  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return this.validate(a) && this.validate(b) ? a / b : 0;
  }

  /**
   * 値の検証
   */
  private validate(value: number): boolean {
    return typeof value === 'number' && !isNaN(value);
  }
}
