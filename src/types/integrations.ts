export type ConnectedIntegrationsFields = {
  name: string;
  connected: boolean;
  has_settings: boolean;
  has_accounts: boolean;
  has_get_started: boolean;
  has_pro_version: boolean;
  team_members_setup?: boolean;
};

export type ConnectedIntegrationsFieldsMicrosoft =
  ConnectedIntegrationsFields & {
    teams_enabled: boolean;
  };