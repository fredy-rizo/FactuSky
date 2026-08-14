export const Paginate = (req, res, next) => {
  let perpage = req.params.perpage ? req.params.perpage : 10;
  let pag = req.params.pag > 1 ? req.params.pag - 1 : 0;

  req.body.skippag = pag * perpage;
  req.body.limit = perpage;
  next();
};
