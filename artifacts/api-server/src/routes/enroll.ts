import { Router, type Request, type Response } from "express";

const enrollRouter = Router();

enrollRouter.post("/enroll", async (req: Request, res: Response) => {
  const payload = req.body;
  const log = req.log ?? console;

  if (payload.type === "individual") {
    log.info(
      {
        applicantType: "individual",
        program: payload.program,
        mode: payload.mode,
        category: payload.category,
        lang: payload.lang,
        hasYoutube: !!payload.youtube,
        hasDiscount: !!payload.discount,
      },
      "Individual enrollment received",
    );
  } else if (payload.type === "institution") {
    log.info(
      {
        applicantType: "institution",
        program: payload.program,
        studentCount: payload.studentCount,
        teacherCount: payload.teacherCount,
        lang: payload.lang,
        hasDiscount: !!payload.discount,
      },
      "Institution enrollment received",
    );
  }

  res.status(200).json({ success: true, message: "Enrollment received" });
});

export default enrollRouter;
