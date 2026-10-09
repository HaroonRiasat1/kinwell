import * as auth from '../services/auth.service.js';

export const login = async (req, res) => res.json(await auth.login(req.body));
export const requestParentCode = async (req, res) => res.json(await auth.requestParentCode(req.body));
export const verifyParentCode = async (req, res) => res.json(await auth.verifyParentCode(req.body));
export const forgot = async (req, res) => res.json(await auth.requestPasswordReset(req.body));
export const logout = async (req, res) => res.json(await auth.logout(req.user, req.body));
export const me = async (req, res) => res.json({ user: req.user.toPublic() });
