import { genSaltSync, compareSync, hashSync } from "bcrypt";

export function encryptPassword(password) {
    const salt = genSaltSync(10);
    return hashSync(password, salt);
}

export function comparePasswords(password, hash) {
    return compareSync(password, hash);
}