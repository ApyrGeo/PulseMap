import { MergeResultItem } from '../../services/AIApiService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
} from '@mui/material';

interface MergeResultItemComponentProps {
  result: MergeResultItem;
  onForceMerge: (location1Id: number, location2Id: number) => void;
}

const MergeResultItemComponent = ({
  result,
  onForceMerge,
}: MergeResultItemComponentProps) => {
  const isPossibleDuplicate = result.matchResult === 'PossiblySameLocation';

  const getActionColor = (action: string) => {
    if (action === 'merged') return 'success';
    if (action === 'ignored') return 'default';
    return 'info';
  };

  const getMatchResultColor = (matchResult: string) => {
    if (matchResult === 'SameLocation') return 'success';
    if (matchResult === 'PossiblySameLocation') return 'warning';
    if (matchResult === 'DifferentLocation') return 'default';
    return 'info';
  };

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            Location #{result.location1Id} ↔ Location #{result.location2Id}
          </Typography>
          <Chip label={result.distance} size="small" variant="outlined" />
          <Chip
            label={result.matchResult}
            size="small"
            color={getMatchResultColor(result.matchResult)}
          />
          <Chip
            label={result.action}
            size="small"
            color={getActionColor(result.action)}
          />
          {isPossibleDuplicate && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              onClick={() =>
                onForceMerge(result.location1Id, result.location2Id)
              }
              sx={{ ml: 'auto' }}
            >
              Force Merge
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MergeResultItemComponent;
