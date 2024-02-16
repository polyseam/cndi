import { CLOUDINIT_RETRY_INTERVAL } from "consts";
export const loopUntilSuccess = (
  command: string,
  retryMsg: string,
  interval = CLOUDINIT_RETRY_INTERVAL,
) =>
  `while ! ${command}; do echo '${retryMsg}, retrying in ${interval} seconds'; sleep ${interval}; done`;
