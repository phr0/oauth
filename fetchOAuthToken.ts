function getParameterByNameFromHash(name: string, hash: string) {
  var match = RegExp("[#&]" + name + "=([^&]*)").exec(hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

function getAccessTokenFromHash(hash: string) {
  return getParameterByNameFromHash("access_token", hash);
}

export function getTokenHashWithIframe(serviceUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    function onLoad(e: any) {
      try {
        resolve(e.currentTarget.contentWindow.location.hash);
      } catch (error) {
        console.error("could not read iframe content", serviceUrl);
        reject();
      }
    }

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.getElementsByTagName("body")[0].appendChild(iframe);
    iframe.setAttribute("src", serviceUrl);
    iframe.onload = onLoad;
  });
}

export function fetchOAuthToken(serviceUrl: string) {
  const currentAccessToken = getAccessTokenFromHash(window.location.hash);
  if (currentAccessToken) return Promise.resolve(currentAccessToken);

  function redirectOnError(error: any) {
    window.location.href = serviceUrl;
    throw error;
  }

  function validateAccessToken(accessToken: string | null | void) {
    if (accessToken) return accessToken;
    throw new Error("could not read access token from iframe");
  }

  return getTokenHashWithIframe(serviceUrl)
    .then(getAccessTokenFromHash)
    .catch(redirectOnError)
    .then(validateAccessToken);
}
