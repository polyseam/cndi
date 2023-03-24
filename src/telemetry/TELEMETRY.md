# cndi telemetry

CNDI telemetry is used to help us understand how people are using the tool so we
can make it better. All telemetry code is in the `src/telemetry` directory so it
is simple to audit and understand.

We will **never** provide this data to anyone except CNDI contributors.

## default event

CNDI will by default send an event that includes:

- The version of CNDI
- Which command was called
- The value of `GIT_REPO`
- Repo Hash

```jsonc
// default event
{
  "version": "1.5.0",
  "name": "command_exit",
  "command": "cndi run",
  "repo_id": "eb0aee70de92acd688b70dddb3d0b1fb8832d81bbdb98933b5f1accde3e0ded6",
  "repo_url": "https://github.com/your/repo",
  "exit_code": 0
}
```

## anonymous telemetry

CNDI can be configured to send anonymous events by hashing your repo URL, this
enables us to track the number of unique repos using CNDI without us knowing the
repo URL.

```bash
# .env
CNDI_TELEMETRY='anonymous'
```

```jsonc
// anonymous event
{
  "version": "1.5.0",
  "command": "run",
  "name": "command_exit",
  "exit_code": 0,
  "repo_id": "eb0aee70de92acd688b70dddb3d0b1fb8832d81bbdb98933b5f1accde3e0ded6"
}
```

## disable telemetry

CNDI can be configured to not send any telemetry events.

```bash
# .env
CNDI_TELEMETRY='none'
```
