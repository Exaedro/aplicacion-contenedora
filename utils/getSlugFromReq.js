export function getSlugFromReq(req) {
    if (req.params && req.params.slug) return req.params.slug;
    const m = req.originalUrl.match(/^\/modulos\/([^\/\?\#]+)/);
    return m ? m[1] : null;
}