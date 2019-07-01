type OAuthServiceType = "azure-ad";

function createAzureAdUrl(config: {
  applicationId: string;
  scope: string;
  redirectUri: string;
  domain?: string;
}) {
  return `https://login.microsoftonline.com/post.at/oauth2/v2.0/authorize?client_id=${
    config.applicationId
  }&redirect_uri=${config.redirectUri}&response_type=token&scope=${
    config.scope
  }&domain_hint=${config.domain}`;
}

export function getOAuthServiceUrlCreator(type: OAuthServiceType) {
  switch (type) {
    case "azure-ad":
      return createAzureAdUrl;
  }
}
