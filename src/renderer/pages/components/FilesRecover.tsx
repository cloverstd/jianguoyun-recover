import {
  Button,
  InputNumber,
  List,
  message,
  PageHeader,
  Progress,
  Result,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import './filesrecover.css';
import { FileOutlined, FolderFilled } from '@ant-design/icons';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import { undoEvents } from '../../service/api';
import axios from 'axios';

const Duration = ({ duration }: { duration: number }) => {
  const n = duration / 1000;
  if (n > 300) {
    return <>{(n / 60).toFixed(2)} 分钟</>;
  }
  if (!n) {
    return null;
  }
  return <>{n.toFixed(2)} 秒</>;
};

const formatDuration = (duration: number) => {
  const n = duration / 1000;
  if (n > 60) {
    return `${n.toFixed(2)} 分钟`;
  }
  return `${n.toFixed(3)} 秒`;
};

const Rate = ({ duration, count }: { duration: number; count: number }) => {
  if (!duration) {
    return null;
  }
  return <>{((count / duration) * 1000).toFixed(2)} 个/秒</>;
};

const ProgressFormat = ({
  success,
  count,
  total,
}: {
  success: boolean;
  count: number;
  total: number;
}) => {
  if (!count || success) {
    return null;
  }
  return (
    <>
      <span>
        {count}/{total}
      </span>
    </>
  );
};

const opTypeMapping: Record<I.Jianguoyun.OpType, string | undefined> = {
  ADD: '新增',
  DELETE: '删除',
  EDIT: '编辑',
  MOVE: '移动',
  RENAME: '重命名',
  ALL: undefined,
  RESTORE: '恢复',
};

const Meta = ({ event }: { event: I.Jianguoyun.Event }) => {
  const opType = opTypeMapping[event.opType];
  return (
    <span>
      {event.isdir ? '目录' : '文件'} 在{' '}
      {moment(event.timestamp).format('YYYY-MM-DD HH:mm:SS')} 被{' '}
      {event.editorNickName} {opType}
    </span>
  );
};

export default ({
  events,
  sndbox,
}: {
  events: I.Jianguoyun.Event[];
  sndbox: I.Jianguoyun.Sandbox;
}) => {
  const [recoverFiles, setRecoverFiles] = useState(0);

  const [duration, setDuration] = useState(0);

  const [loading, setLoading] = useState(false);

  const pauseRef = useRef(false);

  const [concurrence, setConcurrence] = useState(2);

  const [error, setError] = useState<unknown>();

  const finished = useMemo(
    () => recoverFiles === events.length,
    [recoverFiles, events]
  );

  const recover = async (...args: Parameters<typeof undoEvents>) => {
    const start = Date.now();
    const res = await undoEvents(...args);
    setDuration((d) => d + Date.now() - start);
    setRecoverFiles((c) => c + 1);
    return res;
  };

  useEffect(() => {
    return () => {
      pauseRef.current = true;
    };
  }, []);

  useEffect(() => {
    window.onbeforeunload = () => {
      if (loading || (events.length > recoverFiles && recoverFiles > 0)) {
        return '正在恢复中，离开页面将会前功尽弃';
      }
      return null;
    };

    return () => {
      window.onbeforeunload = () => {
        return null;
      };
    };
  }, [loading, events, recoverFiles]);

  const resume = async (sndboxId: string, magicId: string) => {
    pauseRef.current = false;
    setLoading(true);
    try {
      let start = recoverFiles;
      while (!pauseRef.current && start < events.length) {
        const tasks = [];
        for (let i = 0; i < concurrence && start < events.length; i += 1) {
          const event = events[start];
          start += 1;
          tasks.push(recover(sndboxId, magicId, event));
        }
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(tasks);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ marginTop: '30px' }}>
      {finished ? (
        <Result
          status="success"
          title="恭喜你恢复文件成功"
          subTitle={`一共恢复 ${recoverFiles} 个文件，耗时 ${formatDuration(
            duration
          )}，平均速度 ${(duration / 1000 / recoverFiles).toFixed(2)} 个/秒`}
          extra={[
            <Button
              type="primary"
              key="continue"
              onClick={() => {
                window.location.reload();
              }}
            >
              继续恢复其他文件
            </Button>,
          ]}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>共 {events.length} 个文件</div>
            <Space>
              <Tooltip key="0" title="预计剩余时间">
                <Tag>
                  <Duration
                    duration={
                      (duration * events.length) / recoverFiles - duration
                    }
                  />
                </Tag>
              </Tooltip>
              <Tag key="1">
                <ProgressFormat
                  count={recoverFiles}
                  total={events.length}
                  success={events.length === recoverFiles}
                />
              </Tag>
              <Tooltip key="2" title="当前恢复速度">
                <Tag key="2">
                  {recoverFiles !== events.length && (
                    <Rate duration={duration} count={recoverFiles} />
                  )}
                </Tag>
              </Tooltip>
              <Tooltip key="3" title="已用时间">
                <Tag key="3">
                  <Duration duration={duration} />
                </Tag>
              </Tooltip>
            </Space>
            <Space key="concurrence">
              <div>同时恢复</div>
              <InputNumber
                disabled={loading}
                value={concurrence}
                onChange={(v) => {
                  if (v > 10 || v < 1) {
                    message.error(`只能选择 1-10`);
                  } else {
                    setConcurrence(v);
                  }
                }}
              />
            </Space>
            {!loading && (
              <Button
                key="recover"
                type="primary"
                onClick={() => {
                  resume(sndbox.sandboxId, sndbox.magic);
                }}
                loading={loading}
              >
                开始恢复
              </Button>
            )}
            {loading && (
              <Button
                key="pause"
                onClick={() => {
                  pauseRef.current = true;
                }}
              >
                暂停
              </Button>
            )}
          </Space>
          {!error && (
            <Progress
              className="events-recover-progess"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              type="circle"
              format={(percent) => `${percent?.toFixed(2)}%`}
              percent={(recoverFiles * 100) / events.length}
            />
          )}
          <div className="files-recover-list">
            {
              error ? (
                <Result
                  status="error"
                  title="发生了一些错误，但是可能不影响文件恢复"
                  subTitle={`${error}`}
                  extra={[
                    <Button
                      key="error"
                      type="primary"
                      onClick={() => {
                        setError(undefined);
                        resume(sndbox.sandboxId, sndbox.magic);
                      }}
                    >
                      继续
                    </Button>,
                  ]}
                />
              ) : null
              // <List className="" bordered>
              //   {events.map((item, idx) => (
              //     <List.Item
              //       key={idx}
              //       className={
              //         idx <= recoverFiles ? 'files-recover-done' : undefined
              //       }
              //     >
              //       <List.Item.Meta
              //         avatar={<Avatar event={item} />}
              //         title={item.path}
              //         description={<Meta event={item} />}
              //       />
              //     </List.Item>
              //   ))}
              // </List>
            }
          </div>
        </Space>
      )}
    </div>
  );
};
