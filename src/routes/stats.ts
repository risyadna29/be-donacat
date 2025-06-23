import { Router } from "express"
import { StatsController } from "../controllers/statsController"

const router = Router()
const statsController = new StatsController()

router.get("/", statsController.getImpactStats.bind(statsController))

export default router 