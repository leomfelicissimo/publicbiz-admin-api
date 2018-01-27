const functions = require('firebase-functions');
const https = require('https');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const httpsRequest = (url, onEnd, onError) => {
  let data = '';
  https.get(url, res => {
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      onEnd(data);
    });
  }).on('error', onError);
};

const requestFacebookPages = (accessToken, onSuccess, onError) => {
  const managePagesEndpoint = `https://graph.facebook.com/me/accounts?access_token=${accessToken}`;

  const parseManagePagesData = facebookData => {
    const managePagesPermissions = 'ADMINISTER,CREATE_CONTENT,BASIC_ADMIN';
    const permissionedPages = facebookData.filter(page =>
      page.perms.some(perm => managePagesPermissions.includes(perm)));
    const parsedPages = permissionedPages.map(page => ({
      id: page.id,
      name: page.name,
      accessToken: page.accessToken,
    }));
    return parsedPages;
  };

  console.log(managePagesEndpoint);
  httpsRequest(managePagesEndpoint, data => {
    const facebookResponse = JSON.parse(data);
    console.log('facebookResponse', facebookResponse);
    const pages = parseManagePagesData(facebookResponse.data);
    onSuccess(pages);
  }, onError);
}

const requestFacebookToken = (appId, appSecret, onSuccess, onError) => {
  const accessTokenUrl =
    `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`;
  console.log(accessTokenUrl);
  httpsRequest(accessTokenUrl, data => {
    const parsedData = JSON.parse(data);
    console.log(parsedData);
    onSuccess(parsedData.access_token)
  }, error => {
    console.log('accessTokenError: ', error);
    onError(error);
  });
};

exports.getUserPages = functions.https.onRequest((req, res) => {
  console.log('teste');
  if (req.query && req.query.userToken) {
    const userToken = req.query.userToken;
    // requestFacebookToken(APP_ID, APP_SECRET, token => {
    // }, error => res.status(500).send(`Cannot get the access token from facebook ${error}`));
    requestFacebookPages(userToken, pages => res.status(200).send(pages),
        error => res.status(500).send(`Cannot get user pages from facebook: ${error}`)
      );

  } else { res.status(400).send('Attemps to get uid from request'); }
});
