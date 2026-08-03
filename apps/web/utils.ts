import { formatDistanceStrict } from "date-fns";

export const timeAgo = (time: number): string => {
    return formatDistanceStrict(
        new Date(time),
        new Date(),
        { addSuffix: true }
      );
};
