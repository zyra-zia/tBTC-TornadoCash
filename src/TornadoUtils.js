import {bigInt as snarkBigInt} from 'snarkjs';
import circomlib from 'circomlib';
import { BN } from 'web3-utils';
import crypto from 'crypto';

export default class TornadoUtils {

    static createDeposit(nullifier, secret) {
        let deposit = { nullifier, secret };
        deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)]);
        deposit.commitment = this.pedersenHash(deposit.preimage);
        deposit.commitmentHex = this.toHex(deposit.commitment);
        deposit.nullifierHash = this.pedersenHash(deposit.nullifier.leInt2Buff(31));
        deposit.nullifierHex = this.toHex(deposit.nullifierHash);
        return deposit;
    }

    /** Compute pedersen hash */
    static pedersenHash(data){ 
        return circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];
    }

    /** BigNumber to hex string of specified length */
    static toHex(number, length = 32){
        return '0x' + (number instanceof Buffer ? number.toString('hex') : snarkBigInt(number).toString(16)).padStart(length * 2, '0');
    }

    static fromDecimals( {amount, decimals} ) {
        amount = amount.toString()
        let tbtc = amount.toString()
        const base = new BN('10').pow(new BN(decimals))
        const baseLength = base.toString(10).length - 1 || 1
      
        const negative = tbtc.substring(0, 1) === '-'
        if (negative) {
          tbtc = tbtc.substring(1)
        }
      
        if (tbtc === '.') {
          throw new Error('Error while converting number ' + amount + ' to decimals, invalid value')
        }
      
        // Split it into a whole and fractional part
        const comps = tbtc.split('.')
        if (comps.length > 2) {
          throw new Error(
            'Error while converting number ' + amount + ' to decimals,  too many decimal points'
          )
        }
      
        let whole = comps[0]
        let fraction = comps[1]
      
        if (!whole) {
          whole = '0'
        }
        if (!fraction) {
          fraction = '0'
        }
        if (fraction.length > baseLength) {
          throw new Error(
            'Error while converting number ' + amount + ' to decimals, too many decimal places'
          )
        }
      
        while (fraction.length < baseLength) {
          fraction += '0'
        }
      
        whole = new BN(whole)
        fraction = new BN(fraction)
        let decimal = whole.mul(base).add(fraction)
      
        if (negative) {
          decimal = decimal.mul(negative)
        }
      
        return new BN(decimal.toString(10), 10)
      }
    
      /** Generate random number of specified byte length */
      static rbigint(nbytes){
        let rb = crypto.randomBytes(nbytes);
        let bg =  snarkBigInt.leBuff2int(rb);
        return bg;
      }
    
}