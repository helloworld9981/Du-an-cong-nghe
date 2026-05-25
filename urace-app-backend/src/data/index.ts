import { userData } from "./user.data";
import { groupData } from "./group.data";
import { contestData } from "./contest.data";
import { teamData } from "./team.data";
import config from '../config/env.config';

export async function initializeDatabase() {
  const uri = config.MONGODB_URI;
  const dbName = config.DB_NAME;

  await Promise.all([
    userData.connect(uri, dbName),
    groupData.connect(uri, dbName),
    contestData.connect(uri, dbName),
    teamData.connect(uri, dbName),
  ]);
}

export { userData, groupData, contestData, teamData };
