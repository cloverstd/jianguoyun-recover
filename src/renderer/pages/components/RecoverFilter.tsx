import { Button, DatePicker, Form, Select } from 'antd';
import moment from 'moment';

const { RangePicker } = DatePicker;

const optype: { type: I.Jianguoyun.OpType; name: string }[] = [
  {
    type: 'ALL',
    name: '所有',
  },
  {
    type: 'DELETE',
    name: '删除',
  },
  {
    type: 'RENAME',
    name: '重命名',
  },
  {
    type: 'MOVE',
    name: '移动',
  },
  {
    type: 'EDIT',
    name: '编辑',
  },
  {
    type: 'ADD',
    name: '新增',
  },
];

export default ({
  onSubmit,
  sndboxes,
}: {
  onSubmit: (args: {
    opType: I.Jianguoyun.OpType;
    range: [moment.Moment, moment.Moment];
    sndbox: I.Jianguoyun.Sandbox;
  }) => void;
  sndboxes: I.Jianguoyun.Sandbox[];
}) => {
  const [form] = Form.useForm<{
    optype: I.Jianguoyun.OpType;
    time: [moment.Moment, moment.Moment];
    sndboxIdx: number;
  }>();

  return (
    <div style={{ width: '100%', margin: '0 auto', marginTop: '50px' }}>
      <Form
        form={form}
        initialValues={{ optype: 'DELETE', sndbox: 0 }}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        autoComplete="off"
        onFinish={() => {
          form.validateFields().then((values) => {
            onSubmit({
              opType: values.optype,
              range: values.time,
              sndbox: sndboxes[values.sndboxIdx],
            });
          });
        }}
      >
        <Form.Item
          label="文件夹"
          name="sndboxIdx"
          rules={[{ required: true, message: '请选择文件夹' }]}
        >
          <Select>
            {sndboxes
              .sort(({ name }) => (name ? 1 : -1))
              .map(({ name }, idx) => (
                <Select.Option key={idx} value={idx}>
                  {!name ? '我的坚果云' : name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="操作类型"
          name="optype"
          rules={[{ required: true, message: '请选择类型' }]}
        >
          <Select>
            {optype.map((op) => (
              <Select.Option key={op.type} value={op.type}>
                {op.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="操作时间"
          name="time"
          rules={[{ required: true, message: '请选择时间' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            showTime
            ranges={{
              今天: [moment().startOf('day'), moment()],
              昨天: [
                moment().startOf('day').subtract(1, 'days'),
                moment().endOf('day').subtract(1, 'days'),
              ],
              最近一周: [
                moment().startOf('day').subtract(1, 'weeks'),
                moment(),
              ],
            }}
            disabledDate={(current) => {
              return moment().isBefore(current);
            }}
          />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 20, span: 8 }}>
          <Button type="primary" htmlType="submit">
            下一步
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
