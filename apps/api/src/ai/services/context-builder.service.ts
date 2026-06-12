import { Injectable } from '@nestjs/common';
import type { QdrantImageResult, QdrantTextResult } from '../../qdrant/qdrant.types';

@Injectable()
export class ContextBuilderService {
  fromTextResults(results: QdrantTextResult[]): string {
    return results
      .map((item) =>
        [
          `Địa điểm: ${item.location_name ?? item.place_slug ?? 'Không rõ'}`,
          `Tỉnh/thành: ${item.province ?? 'Không rõ'}`,
          `Nguồn: ${item.source_file ?? item.s3_key ?? 'Không rõ'}`,
          `Nội dung:\n${item.text ?? ''}`,
        ].join('\n'),
      )
      .join('\n\n---\n\n');
  }

  fromImageResults(results: QdrantImageResult[]): string {
    return results
      .map(
        (item) =>
          `Ảnh khớp: ${item.location_name ?? item.place_slug ?? 'Không rõ'}; score=${item.score.toFixed(4)}; nguồn=${item.s3_key ?? item.filename ?? 'Không rõ'}`,
      )
      .join('\n');
  }
}
