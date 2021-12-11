import useRequest from '@ahooksjs/use-request';
import { Form, Input, message, Modal } from 'antd';
import { AxiosError } from 'axios';
import { getCurrentUser } from '../../service/api';

export default ({ visible, hide }: { visible: boolean; hide: () => void }) => {
  const [form] = Form.useForm<{ email: string; sessionid: string }>();
  const { run: validateSession, loading } = useRequest(
    async () => {
      return getCurrentUser()
        .then(() => true)
        .catch((e) => {
          if ('response' in e) {
            const { response } = e as AxiosError<{
              detailMsg: string;
              errorCode: string;
            }>;
            if (response?.data.errorCode === 'UnAuthorized') {
              // 需要登录
              return false;
            }
            if (response?.data.errorCode === 'IllegalArgument') {
              message.error(`登录失败：${response.data.detailMsg}`);
            } else {
              message.error(`登录失败：${JSON.stringify(response?.data)}`);
            }
          } else {
            message.error(`未知异常：${e}`);
          }
          throw e;
        });
    },
    {
      manual: true,
    }
  );

  const onOk = async () => {
    return form.validateFields().then((values) => {
      form.resetFields();
      localStorage.setItem(
        'cookie',
        JSON.stringify({
          umn: values.email.replace('@', '%40'),
          ta: values.sessionid,
        })
      );

      // eslint-disable-next-line promise/no-nesting
      return validateSession().then((v) => {
        if (!v) {
          message.error('登录失败');
        } else {
          message.success('登录成功');
          hide();
        }
        return undefined;
      });
    });
  };
  return (
    <>
      <Modal
        confirmLoading={loading}
        visible={visible}
        onOk={onOk}
        title="登录坚果云"
        closable={false}
        onCancel={() => hide()}
        okText="登录"
      >
        <Form
          initialValues={{}}
          form={form}
          preserve={false}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          autoComplete="off"
        >
          <Form.Item
            label="email"
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="session id"
            name="sessionid"
            rules={[
              { required: true, message: 'Please input your session id!' },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
