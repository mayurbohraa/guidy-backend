import multer from "multer";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads",
    filename: function (req, file, cb) {
      console.log(file);
      const ext = file.originalname.split(".").pop();
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + "." + ext);
    },
  }),
});

export default upload;
