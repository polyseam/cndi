const getAcceptNodeInviteTemplate = (
  token: string,
  controllerPrivateIp: string,
): string => {
  return `#!/bin/bash
echo "accepting node invite with token ${token}"
microk8s join ${controllerPrivateIp}:25000/${token} --worker`;
};

export default getAcceptNodeInviteTemplate;
