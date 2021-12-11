declare namespace I {
  namespace Jianguoyun {
    export type SndboxMagicId = string;
    export type SndboxId = string;

    export interface PathPerm {
      path: string;
      permission: number;
      caps: number;
    }

    export type OpType =
      | 'DELETE'
      | 'RENAME'
      | 'MOVE'
      | 'ALL'
      | 'EDIT'
      | 'ADD'
      | 'RESTORE';

    export type EventsMarker = number;

    export type EventPath = string;
    export type EventVersion = number;

    export interface Sandbox {
      name: string;
      sandboxId: SndboxId;
      magic: SndMagicId;
      owner: string;
      permission: number;
      caps: number;
      exclusiveUser: boolean;
      pathPerms: PathPerm[];
      isDefault: boolean;
      isOwner: boolean;
      desc: string;
      usedSpace: number;
    }

    // 用户信息
    export interface User {
      sandboxes: Sandbox[];
      userName: string; // 用户邮箱
      nickName: string;

      rateResetLeftMills?: number;
      language?: string;
      freeUpRate?: number;
      phoneVerified?: boolean;
      accountExpireLeftTime?: number;
      accountState?: number;
      totalUsedStorage?: number;
      freeDownRate?: number;
      freeUser?: boolean;
      storageQuota?: number;
      usedUpRate?: number;
      usedDownRate?: number;
    }

    export interface Event {
      id: number;
      opType: OpType; // 操作记录
      path: EventPath;
      isdir: boolean; // 是否是目录
      isdel: boolean;
      size: number;
      version: EventVersion;
      srcMachineName: string; // 操作机器名称
      editorNickName: string; // 操作人用户名
      editorAccount: string; // 操作账号
      timestamp: number; // 操作时间 inMs
      isVirus: boolean;
    }

    export interface Events {
      events: Event[];
      marker: EventsMarker; // 用来翻页的
    }
  }
}
