const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (error) {
    console.log(`Database Error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1
//Returns a list of all states in the state table
const convertStateDbObjectAPI1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};
app.get("/states/", async (request, response) => {
  const getStatesListQuery = `select * from state;`;
  const getStatesListQueryResponse = await database.all(getStatesListQuery);
  response.send(
    getStatesListQueryResponse.map((eachState) =>
      convertStateDbObjectAPI1(eachState)
    )
  );
});
//API-2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const states = `select * from state where state_id=${stateId};`;
  const stateList = await database.get(states);
  response.send(convertStateDbObjectAPI1(stateList));
});
//API-3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrictQueryResponse = await database.run(createDistrictQuery);
  response.send("District Successfully Added");
});
//API-4
const convertDbObject = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `select * from district where district_id=${districtId};`;
  const districtDetails = await database.get(districtQuery);
  response.send(convertDbObject(districtDetails));
});
//API-5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `delete from district where district_id=${districtId};`;
  const deleteDetails = await database.run(deleteQuery);
  response.send("District Removed");
});
//API-6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const detailsQuery = `update district set district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id=${districtId};`;
  const queryResponse = await database.run(detailsQuery);
  response.send("District Details Updated");
});
//API-7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `select sum(cases) as totalCases,
                    sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths 
                    from district where state_id=${stateId};`;
  const queryResponse = await database.get(query);
  response.send(queryResponse);
});
//API-8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `select state_id from district where district_id=${districtId};`;
  const queryResponse = await database.get(query);
  const stateNameQuery = `select state_name as stateName from state where state_id=${queryResponse.state_id};`;
  const stateNameQueryResponse = await database.get(stateNameQuery);
  response.send(stateNameQueryResponse);
});

module.exports = app;
