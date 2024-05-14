import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {
  copyPublicDocumentToPortfolio,
  createDocument,
  deleteDocument,
  findOrCreateUser,
  getAllDoenetmlVersions,
  getDoc,
  getDocEditorData,
  getDocViewerData,
  listUserDocs,
  saveDoc,
  searchPublicDocs,
} from "./model";
import path from 'path';
import { Provider as lti } from 'ltijs';
import Database from 'ltijs-sequelize';

dotenv.config();

const db = new Database(process.env.DATABASE_URL, process.env.DATABASE_USER, process.env.DATABASE_PASS, { dialect: 'postgres' });

// Setup provider
lti.setup(process.env.LTI_KEY as string, // Key used to sign cookies and tokens
          { 
            plugin: db
          },
          { // Options
            // appRoute: '/', loginRoute: '/login',
            cookies: {
              secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
              sameSite: '' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
            },
            // devMode: true  Set DevMode to false if running in a production environment with https
          }
         )

// Set lti launch callback
lti.onConnect((token, req, res) => {
  console.log(token)
  return res.send('It\'s alive!')
})

const app: Express = express();
app.use(cookieParser());
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/api/getQuickCheckSignedIn.php", (req: Request, res: Response) => {
  const signedIn = req.cookies.email ? true : false;
  res.send({ signedIn: signedIn });
});

app.get("/api/getPortfolioCourseId.php", (req: Request, res: Response) => {
  res.send({});
});

app.get("/api/checkForCommunityAdmin.php", (req: Request, res: Response) => {
  res.send({});
});

app.get("/api/loadProfile.php", (req: Request, res: Response) => {
  const loggedInEmail = req.cookies.email;
  res.send({
    profile: {
      screenName: "",
      email: loggedInEmail,
      firstName: "",
      lastName: "",
      profilePicture: "anonymous",
      trackingConsent: true,
      signedIn: "0",
      userId: "",
      canUpload: "0",
    },
  });
});

app.get("/api/getPortfolio.php", async (req: Request, res: Response) => {
  const loggedInEmail = req.cookies.email;
  const loggedInUserId = Number(req.cookies.userId);
  const ret = await listUserDocs(loggedInUserId);
  res.send(ret);
});

app.get("/api/sendSignInEmail.php", async (req: Request, res: Response) => {
  const email: string = req.query.emailaddress as string;
  const userId = await findOrCreateUser(email);
  res.cookie("email", email);
  res.cookie("userId", String(userId));
  res.send({ success: true });
});

app.get(
  "/api/deletePortfolioActivity.php",
  async (req: Request, res: Response) => {
    const doenetId = Number(req.query.doenetId as string);
    const docId = await deleteDocument(doenetId);
    res.send({ success: true, docId });
  },
);

app.get(
  "/api/createPortfolioActivity.php",
  async (req: Request, res: Response) => {
    const loggedInUserId = Number(req.cookies.userId);
    const docId = await createDocument(loggedInUserId);
    res.send({ success: true, docId, doenetId: docId, pageDoenetId: docId });
  },
);

app.get(
  "/api/updatePortfolioActivityLabel.php",
  (req: Request, res: Response) => {
    const doenetId = Number(req.query.doenetId as string);
    const label = req.query.label as string;
    saveDoc({ docId: doenetId, name: label });
    res.send({ success: true });
  },
);

app.get("/api/updateIsPublicActivity.php", (req: Request, res: Response) => {
  const doenetId = Number(req.query.doenetId as string);
  // figure out a definite strategy for representing booleans and transmitting them
  const isPublicRaw = req.query.isPublic as string;
  let isPublic = false;
  if (isPublicRaw == "1") {
    isPublic = true;
  }
  saveDoc({ docId: doenetId, isPublic });
  res.send({ success: true });
});

app.get("/api/loadSupportingFileInfo.php", (req: Request, res: Response) => {
  const doenetId = Number(req.query.doenetId as string);
  res.send({
    success: true,
    supportingFiles: [],
    canUpload: true,
    userQuotaBytesAvailable: 1000000,
    quotaBytes: 9000000,
  });
});

app.get("/api/checkCredentials.php", (req: Request, res: Response) => {
  const loggedIn = req.cookies.email ? true : false;
  res.send({ loggedIn });
});

app.get(
  "/api/getCoursePermissionsAndSettings.php",
  (req: Request, res: Response) => {
    res.send({});
  },
);

app.get(
  "/api/searchPublicActivities.php",
  async (req: Request, res: Response) => {
    const query = req.query.q as string;
    res.send({
      success: true,
      searchResults: {
        users: [], // TODO - this
        activities: await searchPublicDocs(query),
      },
    });
  },
);

app.get("/api/loadPromotedContent.php", (req: Request, res: Response) => {
  res.send({
    success: true,
    carouselData: {},
  });
});

app.get(
  "/api/getPortfolioEditorData/:doenetId",
  async (req: Request, res: Response) => {
    const doenetId = Number(req.params.doenetId);
    const editorData = await getDocEditorData(doenetId);
    res.send(editorData);
  },
);

app.get(
  "/api/getAllDoenetmlVersions.php",
  async (req: Request, res: Response) => {
    const allDoenetmlVersions = await getAllDoenetmlVersions();

    res.send(allDoenetmlVersions);
  },
);

app.get(
  "/api/getPortfolioActivityView.php",
  async (req: Request, res: Response) => {
    const doenetId = Number(req.query.doenetId as string);

    const viewerData = await getDocViewerData(doenetId);
    res.send(viewerData);
  },
);

app.get("/api/getPortfolioCourseId.php", (req: Request, res: Response) => {
  res.send({});
});

app.get("/api/loadPromotedContentGroups.php", (req: Request, res: Response) => {
  res.send({});
});

app.post("/api/saveDoenetML.php", (req: Request, res: Response) => {
  const body = req.body;
  const doenetML = body.doenetML;
  const docId = Number(body.pageId);
  saveDoc({ docId, content: doenetML });
  res.send({ success: true });
});

app.post(
  "/api/updatePortfolioActivitySettings.php",
  (req: Request, res: Response) => {
    const body = req.body;
    const docId = Number(body.doenetId);
    const imagePath = body.imagePath;
    const label = body.label;
    // TODO - deal with learning outcomes
    const learningOutcomes = body.learningOutcomes;
    const isPublic = body.public === "true";
    const doenetmlVersionId = Number(body.doenetmlVersionId);
    saveDoc({ docId, imagePath, name: label, isPublic, doenetmlVersionId });
    res.send({ success: true });
  },
);

app.post(
  "/api/duplicatePortfolioActivity",
  async (req: Request, res: Response) => {
    const targetDocId = Number(req.body.docId);
    const loggedInUserId = Number(req.cookies.userId);

    let newDocId = await copyPublicDocumentToPortfolio(
      targetDocId,
      loggedInUserId,
    );

    res.send({ newDocId });
  },
);

app.get(
  "/media/byPageId/:doenetId.doenet",
  async (req: Request, res: Response) => {
    const doenetId = Number(req.params.doenetId);
    const doc = await getDoc(doenetId);
    res.send(doc.contentLocation);
  },
);

const setup = async () => {
  // Deploy server and open connection to the database
  await lti.deploy({ port: Number(port) })

  // Register platform
  await lti.registerPlatform({
    url: 'https://platform.url',
    name: 'Platform Name',
    clientId: 'TOOLCLIENTID',
    authenticationEndpoint: 'https://platform.url/auth',
    accesstokenEndpoint: 'https://platform.url/token',
    authConfig: { method: 'JWK_SET', key: 'https://platform.url/keyset' }
  })

  console.log(`[server]: Server is running at http://localhost:${port}`);
}

setup()
