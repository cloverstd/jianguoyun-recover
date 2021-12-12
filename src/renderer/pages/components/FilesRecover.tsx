import {
  Button,
  InputNumber,
  List,
  message,
  PageHeader,
  Progress,
  Result,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import './filesrecover.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useDynamicList } from 'ahooks';
import { undoEvents } from '../../service/api';

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
    return `${(n / 60).toFixed(2)} 分钟`;
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

// const Meta = ({ event }: { event: I.Jianguoyun.Event }) => {
//   const opType = opTypeMapping[event.opType];
//   return (
//     <span>
//       {event.isdir ? '目录' : '文件'} 在{' '}
//       {moment(event.timestamp).format('YYYY-MM-DD HH:mm:SS')} 被{' '}
//       {event.editorNickName} {opType}
//     </span>
//   );
// };

const formatAxiosError = (e: unknown): string => {
  if (axios.isAxiosError(e) && e.response) {
    return `Error: ${e.response?.status}, ${JSON.stringify(e.response?.data)}`;
  }
  return `${e}`;
};

export default ({
  events,
  sndbox,
  recoverFilesCount,
  durationInit,
}: {
  events: I.Jianguoyun.Event[];
  sndbox: I.Jianguoyun.Sandbox;
  recoverFilesCount: number | undefined;
  durationInit: number | undefined;
}) => {
  const [recoverFiles, setRecoverFiles] = useState(recoverFilesCount || 0);

  const [auto, setAuto] = useState(false);

  const [duration, setDuration] = useState(durationInit || 0);

  const [loading, setLoading] = useState(false);

  const pauseRef = useRef(false);

  const [concurrence, setConcurrence] = useState(2);

  const [error, setError] = useState<unknown>();

  const { list: errors, push: addError } = useDynamicList<unknown>([]);

  const finished = useMemo(
    () => recoverFiles === events.length,
    [recoverFiles, events]
  );

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('sndbox', JSON.stringify(sndbox));
  }, [events, sndbox]);

  useEffect(() => {
    localStorage.setItem('recoverFiles', JSON.stringify(recoverFiles));
  }, [recoverFiles]);

  useEffect(() => {
    localStorage.setItem('duration', JSON.stringify(duration));
  }, [duration]);

  const recover = async (...args: Parameters<typeof undoEvents>) => {
    const start = Date.now();
    const res = await undoEvents(...args).catch((e) => {
      if (!axios.isAxiosError(e) || !e.response) {
        throw e;
      }
      if (e.response.status !== 403) {
        throw e;
      }
      const { response } = e as AxiosError<{
        errorCode: string;
        detailMsg: string;
      }>;
      if (response?.data.errorCode !== 'DirectoryNotEmpty') {
        // 这个错误应该可以忽略调
        throw e;
      }
    });
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

    if (events.length === recoverFiles) {
      localStorage.removeItem('sndbox');
      localStorage.removeItem('events');
      localStorage.removeItem('duration');
      localStorage.removeItem('recoverFiles');
    }

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
        try {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(tasks);
        } catch (e) {
          // 当有异常，忽略当前已经恢复的，再继续恢复
          setRecoverFiles((c) => c - concurrence);
          throw e;
        }
      }
    } catch (e) {
      if (auto && `${e}`.includes('timeout')) {
        addError(e);
        setLoading(true);
        message.error('发生了一些错误，将会在 3 秒后自动重试');
        setTimeout(() => {
          resume(sndboxId, magicId);
        }, 3000);
      } else {
        setError(e);
      }
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
          )}，平均速度 ${((recoverFiles / duration) * 1000).toFixed(2)} 个/秒`}
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
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Space>
              <div>
                <Tooltip title="全自动模式将会忽略超时错误，并且自动重试">
                  全自动
                </Tooltip>
              </div>
              <Switch
                disabled={loading}
                checked={auto}
                onChange={(v) => setAuto(v)}
              />
            </Space>
            <Space key="concurrence">
              <div>
                <Tooltip title="并不是同时恢复的文件数量越多恢复速度越快">
                  同时恢复
                </Tooltip>
              </div>
              <InputNumber
                className="concurence"
                disabled={loading}
                value={concurrence}
                onChange={(v) => {
                  if (v > 5 || v < 1) {
                    message.error(`只能选择 1-5`);
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
                {recoverFiles > 0 ? '继续' : '开始'}恢复
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
            <Space className="recover-progress-container">
              <Space direction="vertical">
                <Space className="recover-info">
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
                {errors.length > 0 && (
                  <div className="recover-error-log">
                    <PageHeader title="错误日志">
                      <List>
                        {errors.map((e, idx) => (
                          <List.Item key={idx.toString()}>
                            {formatAxiosError(e)}
                          </List.Item>
                        ))}
                      </List>
                    </PageHeader>
                  </div>
                )}
              </Space>
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
            </Space>
          )}
          <div className="files-recover-list">
            {
              error ? (
                <Result
                  status="error"
                  title="发生了一些错误，但是可能不影响文件恢复"
                  subTitle={formatAxiosError(error)}
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
