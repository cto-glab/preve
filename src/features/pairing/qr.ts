// Only a public one-time code is encoded; vehicle secrets stay on the vehicle.
export function pairingQr(code:string){if(!/^\d{3}-\d{3}$/.test(code))throw new Error('Invalid pairing code');return 'preve-mobile://pair?code='+code.replace('-','');}
export function parsePairingQr(value:string){const match=/^preve-mobile:\/\/pair\?code=(\d{6})$/.exec(value);return match?match[1]:null;}
