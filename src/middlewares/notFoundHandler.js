const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `${req.url} Not found`,
  });
};

export default notFoundHandler;
