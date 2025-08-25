export type NotificationType = {
  label: string;
  type: string;
  default: boolean;
  template: {
    subject: string;
    message: string;
  };
  times?: Array<{ unit: string; value: number }>;
};

export type NoticeMessage = {
  type: 'success' | 'error';
  title: string;
  message: string;
}; 