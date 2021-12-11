import instance from './instance';

/**
 * 获取当前登陆用户的信息
 * @returns
 */
export const getCurrentUser = () => {
  return instance.get<I.Jianguoyun.User>('/userop/getUserInfo').then((resp) => {
    return resp.data;
  });
};

/**
 * 获取操作记录
 * @param sanId
 * @param sndMagic
 * @returns
 */
export const getEvents = (
  sndId: I.Jianguoyun.SndboxId,
  sndMagic: I.Jianguoyun.SndboxMagicId,
  marker?: I.Jianguoyun.EventsMarker
) => {
  const qs = new URLSearchParams({
    sndId,
    sndMagic,
  });

  if (marker) {
    qs.set('marker', marker.toString());
  }

  return instance
    .get<I.Jianguoyun.Events>(`/getEvents?${qs.toString()}`)
    .then((resp) => resp.data);
};

/**
 * 恢复操作
 * @param sanId
 * @param sndMagic
 * @param param2
 * @returns
 */
export const undoEvents = (
  sndId: I.Jianguoyun.SndboxId,
  sndMagic: I.Jianguoyun.SndboxMagicId,
  {
    opType: optype,
    path,
    isdel: deleted,
    isdir: dir,
    version,
  }: I.Jianguoyun.Event
) => {
  const qs = new URLSearchParams({ sndId, sndMagic });
  const form = new URLSearchParams();
  form.set('optype', optype);
  form.set('path', path);
  form.set('version', version.toString());
  form.set('deleted', JSON.stringify(deleted));
  form.set('dir', JSON.stringify(dir));
  return instance
    .post(`/fileops/undoEvents?${qs.toString()}`, form.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })
    .then((resp) => resp.data);
};
