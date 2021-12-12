import { useRequest } from 'ahooks';
import { Button, Space, Spin } from 'antd';
import { useMemo, useState } from 'react';
import { getEvents } from '../../service/api';

export default ({
  opType,
  range,
  loading,
  onDone,
  onNext,
  onPrev,
  sndbox,
}: {
  loading: boolean;
  sndbox: I.Jianguoyun.Sandbox;
  onDone: () => void;
  onPrev: () => void;
  onNext: (events: I.Jianguoyun.Event[]) => void;
  opType: I.Jianguoyun.OpType | undefined;
  range: [moment.Moment, moment.Moment] | undefined;
}) => {
  const { sandboxId: sndboxId, magic: magicId, name } = sndbox;

  const [files, setFiles] = useState<I.Jianguoyun.Event[]>([]);

  const scanFilesNumber = useMemo(() => files.length, [files]);

  useRequest(
    async () => {
      if (sndboxId && magicId && range?.length === 2) {
        const start = +range[0];
        const end = +range[1];
        let marker: number | undefined;
        let stop = false;
        for (let i = 0; i < 10 && !stop; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          const data = await getEvents(sndboxId, magicId, marker);
          marker = data.marker;
          setFiles((v) => {
            return [
              ...v,
              ...data.events.filter((event) => {
                if (event.timestamp < end && event.timestamp > start) {
                  if (opType === 'ALL') {
                    return true;
                  }
                  return opType === event.opType;
                }
                return false;
              }),
            ];
          });
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          data.events.forEach((event) => {
            if (event.timestamp <= start) {
              stop = true;
            }
          });
        }
        onDone();
      }
    },
    {
      refreshDeps: [opType, range, sndboxId, magicId],
    }
  );

  if (!opType || range?.length !== 2) {
    return null;
  }

  return (
    <div style={{ margin: '0 auto', marginTop: '60px', width: '50%' }}>
      <Spin
        style={{ display: 'block', margin: '0 auto' }}
        spinning={loading}
        tip={`扫描中，发现 ${scanFilesNumber} 个文件需要恢复`}
      />
      {!loading && (
        <div style={{ margin: '0 auto', textAlign: 'center' }}>
          <Space direction="vertical">
            <div>
              已扫描{name || '我的坚果云'} {scanFilesNumber} 个文件
            </div>
            <Space style={{ marginTop: '50px' }}>
              <Button type="primary" onClick={() => onPrev()}>
                上一步
              </Button>
              <Button
                type="primary"
                onClick={() => onNext(files)}
                disabled={scanFilesNumber === 0}
              >
                下一步
              </Button>
            </Space>
          </Space>
        </div>
      )}
    </div>
  );
};
