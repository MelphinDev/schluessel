/**
 * Export methods to load/save key/vault files.
 *
 * @author Daniel Steinhauer
 */

const fs = require('fs');
const crypto = require('crypto');
const { keyFile, vaultFile } = require('./files.js');
const errors = require('./error.js');

const ivLen = 12;
const tagLen = 16;
const keyLen = 32;
const algorithm = 'aes-256-gcm';

function loadKeyFromFile() {
  if (!fs.existsSync(keyFile)) {
    throw new errors.KeyfileNotFound();
  }

  const buffer = fs.readFileSync(keyFile);
  if (!errors.testBase64.test(buffer.toString('ascii'))) {
    throw new errors.InvalidFormat(keyFile);
  }

  const key = Buffer.from(buffer.toString('ascii'), 'base64');
  if (key.length !== keyLen) {
    throw new errors.WrongKeysize();
  }

  return key;
}

function loadKeyFromEnv() {
  const keyStr = process.env.NODE_MASTER_KEY;
  if (typeof keyStr === 'undefined') {
    return undefined;
  }
  if (!errors.testBase64.test(keyStr)) {
    throw new errors.InvalidFormat(`NODE_MASTER_KEY = ${keyStr}`);
  }

  const key = Buffer.from(keyStr, 'base64');

  if (key.length !== keyLen) {
    throw new errors.WrongKeysize();
  }

  return key;
}

function loadKey() {
  return loadKeyFromEnv() || loadKeyFromFile();
}

function createKey(force = false) {
  if (!force && fs.existsSync(keyFile)) {
    throw new errors.KeyfileAlreadyExists();
  }

  const key = crypto.randomBytes(keyLen);
  fs.writeFileSync(keyFile, key.toString('base64'));
}

function saveVault(plaintext) {
  const key = loadKey();
  const iv = crypto.randomBytes(ivLen);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let ctext = cipher.update(plaintext);
  ctext = Buffer.concat([ctext, cipher.final()]);
  const authtag = cipher.getAuthTag();
  const buf = Buffer.concat([iv, authtag, ctext]);
  fs.writeFileSync(vaultFile, buf.toString('base64'));
}

function loadVault() {
  const key = loadKey();

  if (!fs.existsSync(vaultFile)) {
    throw new errors.VaultfileNotFound();
  }

  const buffer = fs.readFileSync(vaultFile);
  if (!errors.testBase64.test(buffer.toString('ascii'))) {
    throw new errors.InvalidFormat(vaultFile);
  }

  const vault = Buffer.from(buffer.toString('ascii'), 'base64');

  const iv = vault.slice(0, ivLen);
  const cipher = crypto.createDecipheriv(algorithm, key, iv);
  cipher.setAuthTag(vault.slice(ivLen, ivLen + tagLen));
  let ret;
  try {
    ret = cipher.update(vault.slice(ivLen + tagLen));
    ret = Buffer.concat([ret, cipher.final()]);
  } catch (err) {
    throw new errors.WrongKey();
  }

  return ret;
}

module.exports = {
  loadKey,
  createKey,
  saveVault,
  loadVault,
};
